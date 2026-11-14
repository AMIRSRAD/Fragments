use super::archive::{Archive, Session, message};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File},
    io::{self, BufReader, Read, Seek, SeekFrom},
    path::Path,
};
use tauri::{
    AppHandle, Manager,
    http::{Request, Response, StatusCode, header},
};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub(crate) struct Media {
    pub id: String,
    pub mime: String,
    pub caption: String,
}

pub(crate) fn valid_item(item: &Media) -> bool {
    Uuid::parse_str(&item.id).is_ok_and(|id| id.to_string() == item.id)
        && matches!(
            item.mime.as_str(),
            "image/jpeg"
                | "image/png"
                | "image/webp"
                | "image/gif"
                | "video/mp4"
                | "video/webm"
                | "video/quicktime"
        )
}

fn file_type(path: &Path) -> Option<&'static str> {
    match path.extension()?.to_str()?.to_ascii_lowercase().as_str() {
        "jpg" | "jpeg" => Some("image/jpeg"),
        "png" => Some("image/png"),
        "webp" => Some("image/webp"),
        "gif" => Some("image/gif"),
        "mp4" | "m4v" => Some("video/mp4"),
        "webm" => Some("video/webm"),
        "mov" => Some("video/quicktime"),
        _ => None,
    }
}

pub(crate) fn objects(contents: &str) -> Result<Vec<Media>, String> {
    let document: serde_json::Value = serde_json::from_str(contents).map_err(message)?;
    objects_in(&document)
}

pub(crate) fn objects_in(document: &serde_json::Value) -> Result<Vec<Media>, String> {
    let mut items = Vec::new();
    for entry in ["entries", "deleted"]
        .iter()
        .filter_map(|key| document[*key].as_array())
        .flatten()
    {
        if let Some(value) = entry.get("media") {
            let group: Vec<Media> = serde_json::from_value(value.clone())
                .map_err(|_| "A media reference is invalid.")?;
            for item in group {
                if item.id == "sample-cover" || item.id == "legacy-cover" {
                    continue;
                }
                if !valid_item(&item) {
                    return Err("A media reference is invalid.".into());
                }
                items.push(item);
            }
        }
    }
    Ok(items)
}

#[tauri::command]
pub async fn import_media(app: AppHandle) -> Result<Vec<Media>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(files) = rfd::FileDialog::new()
            .set_title("Add photos and videos")
            .add_filter(
                "Photos and videos",
                &[
                    "jpg", "jpeg", "png", "webp", "gif", "mp4", "m4v", "webm", "mov",
                ],
            )
            .pick_files()
        else {
            return Ok(vec![]);
        };
        let archive = app.state::<Archive>();
        let (directory, recipient) = {
            let guard = archive.0.lock().map_err(message)?;
            let session = guard
                .as_ref()
                .ok_or("Unlock the notebook before importing media.")?;
            (
                session.directory.join("media"),
                session.identity.to_public(),
            )
        };
        fs::create_dir_all(&directory).map_err(message)?;
        let mut items = Vec::new();
        let mut committed = Vec::new();
        let result = (|| {
            for source in files {
                let mime = file_type(&source).ok_or("Choose a supported photo or video.")?;
                let id = Uuid::new_v4().to_string();
                let staged = directory.join(format!("{id}.tmp"));
                let final_path = directory.join(format!("{id}.age"));
                let mut input = File::open(&source).map_err(message)?;
                let encryptor = age::Encryptor::with_recipients(std::iter::once(
                    &recipient as &dyn age::Recipient,
                ))
                .map_err(message)?;
                let file = File::create(&staged).map_err(message)?;
                committed.push(staged.clone());
                let mut writer = encryptor.wrap_output(file).map_err(message)?;
                io::copy(&mut input, &mut writer).map_err(message)?;
                writer
                    .finish()
                    .map_err(message)?
                    .sync_all()
                    .map_err(message)?;
                fs::rename(staged, &final_path).map_err(message)?;
                committed.push(final_path);
                items.push(Media {
                    id,
                    mime: mime.into(),
                    caption: source
                        .file_stem()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .into_owned(),
                });
            }
            Ok(items)
        })();
        if result.is_err() {
            for path in committed {
                let _ = fs::remove_file(path);
            }
        }
        result
    })
    .await
    .map_err(message)?
}

fn reader(
    path: &Path,
    identity: &age::x25519::Identity,
) -> Result<age::stream::StreamReader<BufReader<File>>, String> {
    let file = BufReader::new(File::open(path).map_err(message)?);
    age::Decryptor::new_buffered(file)
        .map_err(message)?
        .decrypt(std::iter::once(identity as &dyn age::Identity))
        .map_err(message)
}

pub(crate) fn verify_object(path: &Path, identity: &age::x25519::Identity) -> Result<(), String> {
    io::copy(&mut reader(path, identity)?, &mut io::sink()).map_err(message)?;
    Ok(())
}

pub(crate) fn playback(
    session: &Session,
    request: &Request<Vec<u8>>,
) -> Result<Response<Vec<u8>>, String> {
    let Some((id, kind)) = request.uri().path().trim_start_matches('/').split_once('/') else {
        return Err("Invalid media URL".into());
    };
    let mime = match kind {
        "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "quicktime" => "video/quicktime",
        _ => return Err("Unsupported media type".into()),
    };
    if !valid_item(&Media {
        id: id.into(),
        mime: mime.into(),
        caption: String::new(),
    }) {
        return Err("Invalid media identifier".into());
    }
    let mut stream = reader(
        &session.directory.join("media").join(format!("{id}.age")),
        &session.identity,
    )?;
    let length = stream.seek(SeekFrom::End(0)).map_err(message)?;
    let mut response = Response::builder()
        .header(header::CONTENT_TYPE, mime)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CACHE_CONTROL, "no-store")
        .header("X-Content-Type-Options", "nosniff");
    let range = request.headers().get(header::RANGE);
    let (start, end) = if let Some(value) = range {
        let parsed = value
            .to_str()
            .ok()
            .and_then(|value| value.strip_prefix("bytes="))
            .and_then(|value| value.split_once('-'))
            .and_then(|(start, end)| {
                if length == 0 {
                    return None;
                }
                if start.is_empty() {
                    let suffix = end.parse::<u64>().ok()?;
                    return (suffix > 0).then_some((length.saturating_sub(suffix), length - 1));
                }
                let start = start.parse::<u64>().ok()?;
                let end = if end.is_empty() {
                    length - 1
                } else {
                    end.parse::<u64>().ok()?.min(length - 1)
                };
                (start <= end).then_some((start, end))
            });
        let Some((start, end)) = parsed else {
            return response
                .status(StatusCode::RANGE_NOT_SATISFIABLE)
                .header(header::CONTENT_RANGE, format!("bytes */{length}"))
                .body(vec![])
                .map_err(message);
        };
        let end = end.min(start.saturating_add(4 * 1024 * 1024 - 1));
        response = response.status(StatusCode::PARTIAL_CONTENT).header(
            header::CONTENT_RANGE,
            format!("bytes {start}-{end}/{length}"),
        );
        (start, end + 1)
    } else {
        (0, length)
    };
    // A native webview response takes an owned buffer. Video normally requests byte ranges.
    if end - start > 128 * 1024 * 1024 {
        return Err("Request exceeds the media read window".into());
    }
    stream.seek(SeekFrom::Start(start)).map_err(message)?;
    let mut bytes = vec![0; (end - start) as usize];
    stream.read_exact(&mut bytes).map_err(message)?;
    response
        .header(header::CONTENT_LENGTH, bytes.len())
        .body(bytes)
        .map_err(message)
}

pub fn serve(app: AppHandle, request: Request<Vec<u8>>, responder: tauri::UriSchemeResponder) {
    tauri::async_runtime::spawn_blocking(move || {
        let archive = app.state::<Archive>();
        let response = archive
            .0
            .lock()
            .ok()
            .and_then(|guard| {
                guard
                    .as_ref()
                    .and_then(|session| playback(session, &request).ok())
            })
            .unwrap_or_else(|| {
                Response::builder()
                    .status(404)
                    .header(header::CACHE_CONTROL, "no-store")
                    .body(vec![])
                    .unwrap()
            });
        responder.respond(response);
    });
}
