use age::{
    secrecy::{ExposeSecret, SecretString},
    x25519,
};
use base64::{Engine, engine::general_purpose::STANDARD};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File, OpenOptions},
    io::{self, Read, Write},
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, Emitter, Manager};

const MAX_FILE: u64 = 48 * 1024 * 1024;
const MAX_NOTEBOOK: usize = 30 * 1024 * 1024;

#[derive(Serialize, Deserialize)]
struct Snapshot {
    format: String,
    wrapped_identity: String,
    notebook: String,
}

pub(crate) struct Session {
    pub(crate) directory: PathBuf,
    _writer: File,
    pub(crate) identity: x25519::Identity,
    wrapped_identity: String,
    generation: u64,
}

#[derive(Default)]
pub struct Archive(pub(crate) Mutex<Option<Session>>);

pub(crate) fn message(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn directory(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_local_data_dir()
        .map_err(message)?
        .join("notebook"))
}

fn latest(directory: &Path) -> Result<u64, String> {
    if !directory.exists() {
        return Ok(0);
    }
    let mut generation = 0;
    for entry in fs::read_dir(directory).map_err(message)? {
        let entry = entry.map_err(message)?;
        let name = entry.file_name();
        if let Some(value) = name
            .to_str()
            .and_then(|name| name.strip_prefix("snapshot-"))
            .and_then(|name| name.strip_suffix(".json"))
            .and_then(|number| number.parse::<u64>().ok())
        {
            generation = generation.max(value);
        }
    }
    Ok(generation)
}

fn path(directory: &Path, generation: u64) -> PathBuf {
    directory.join(format!("snapshot-{generation}.json"))
}

fn read_snapshot(path: &Path) -> Result<String, String> {
    if fs::metadata(path).map_err(message)?.len() > MAX_FILE {
        return Err("This backup exceeds the current notebook size limit.".into());
    }
    fs::read_to_string(path).map_err(message)
}

fn validate(notebook: &str) -> Result<(), String> {
    if notebook.len() > MAX_NOTEBOOK {
        return Err(
            "The notebook records exceed 30 MiB. Large legacy photographs may contribute to this limit."
                .into(),
        );
    }
    let parsed: serde_json::Value = serde_json::from_str(notebook).map_err(message)?;
    super::media::objects_in(&parsed)?;
    if !matches!(
        parsed.get("calendar").and_then(|value| value.as_str()),
        Some("gregory" | "persian")
    ) {
        return Err("The notebook calendar is unsupported.".into());
    }
    let entries = parsed
        .get("entries")
        .and_then(|value| value.as_array())
        .ok_or("Notebook entries are missing.")?;
    let mut identifiers = std::collections::HashSet::new();
    for entry in entries {
        for field in ["id", "title", "text", "date", "chapter"] {
            if !entry.get(field).is_some_and(serde_json::Value::is_string) {
                return Err("A notebook entry is incomplete.".into());
            }
        }
        if !identifiers.insert(entry["id"].as_str()) {
            return Err("The notebook contains duplicate entries.".into());
        }
        if let Some(image) = entry.get("imageUrl") {
            let url = image.as_str().ok_or("A photograph reference is invalid.")?;
            if ![
                "data:image/jpeg;base64,",
                "data:image/png;base64,",
                "data:image/webp;base64,",
                "data:image/gif;base64,",
            ]
            .iter()
            .any(|prefix| url.starts_with(prefix))
            {
                return Err("The notebook contains an unsupported photograph.".into());
            }
        }
        let date = entry["date"].as_str().unwrap_or_default();
        if !date.is_empty() {
            let bytes = date.as_bytes();
            if bytes.len() != 10
                || bytes[4] != b'-'
                || bytes[7] != b'-'
                || !bytes
                    .iter()
                    .enumerate()
                    .all(|(index, byte)| index == 4 || index == 7 || byte.is_ascii_digit())
                || !(1..=12).contains(&date[5..7].parse::<u8>().unwrap_or(0))
                || !(1..=31).contains(&date[8..10].parse::<u8>().unwrap_or(0))
            {
                return Err("A notebook date is invalid.".into());
            }
        }
    }
    Ok(())
}

fn decode(
    document: &str,
    password: SecretString,
) -> Result<(x25519::Identity, String, String), String> {
    if document.len() as u64 > MAX_FILE {
        return Err("This backup exceeds the current notebook size limit.".into());
    }
    let snapshot: Snapshot = serde_json::from_str(document)
        .map_err(|_| "This file is not a Fragments notebook backup.")?;
    if snapshot.format != "fragments-snapshot-1" {
        return Err("This notebook format is unsupported.".into());
    }
    let mut unlock = age::scrypt::Identity::new(password);
    unlock.set_max_work_factor(22);
    let wrapped = STANDARD
        .decode(&snapshot.wrapped_identity)
        .map_err(message)?;
    let secret = age::decrypt(&unlock, &wrapped)
        .map_err(|_| "The password is incorrect or the backup is damaged.")?;
    let secret = SecretString::from(String::from_utf8(secret).map_err(message)?);
    let identity = secret
        .expose_secret()
        .parse::<x25519::Identity>()
        .map_err(message)?;
    let bytes = age::decrypt(
        &identity,
        &STANDARD.decode(&snapshot.notebook).map_err(message)?,
    )
    .map_err(|_| "The notebook could not be decrypted.")?;
    let contents = String::from_utf8(bytes).map_err(message)?;
    validate(&contents)?;
    Ok((identity, snapshot.wrapped_identity, contents))
}

fn commit(session: &mut Session, content: &str) -> Result<(), String> {
    validate(content)?;
    let encrypted =
        age::encrypt(&session.identity.to_public(), content.as_bytes()).map_err(message)?;
    let snapshot = Snapshot {
        format: "fragments-snapshot-1".into(),
        wrapped_identity: session.wrapped_identity.clone(),
        notebook: STANDARD.encode(encrypted),
    };
    let generation = session
        .generation
        .checked_add(1)
        .ok_or("Notebook revision limit reached.")?;
    let stage = session.directory.join("writing.tmp");
    let mut file = File::create(&stage).map_err(message)?;
    serde_json::to_writer(&mut file, &snapshot).map_err(message)?;
    file.flush().map_err(message)?;
    file.sync_all().map_err(message)?;
    drop(file);
    fs::rename(&stage, path(&session.directory, generation)).map_err(message)?;
    session.generation = generation;
    // Keep one previous committed generation for recovery and bound disk usage.
    if generation > 2 {
        let _ = fs::remove_file(path(&session.directory, generation - 2));
    }
    Ok(())
}

#[tauri::command]
pub fn archive_exists(app: AppHandle) -> Result<bool, String> {
    Ok(latest(&directory(&app)?)? > 0)
}

#[tauri::command]
pub async fn open_archive(
    app: AppHandle,
    password: String,
    backup_path: Option<PathBuf>,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let archive = app.state::<Archive>();
        let mut state = archive.0.lock().map_err(message)?;
        if state.is_some() { return Err("Lock this notebook before opening another.".into()); }
        let directory = directory(&app)?;
        fs::create_dir_all(&directory).map_err(message)?;
        let writer = OpenOptions::new().read(true).write(true).create(true).truncate(false).open(directory.join("writer.lock")).map_err(message)?;
        writer.try_lock().map_err(|_| "The notebook is already open on this computer.")?;
        let generation = latest(&directory)?;
        let password = SecretString::from(password);
        let restoring = backup_path.is_some();
        let (identity, wrapped_identity, contents) = if let Some(source) = backup_path {
            if generation > 0 { return Err("This computer already has a notebook. Restore this backup on a fresh installation or Windows account.".into()); }
            if source.extension().is_some_and(|extension| extension.eq_ignore_ascii_case("json")) {
                decode(&read_snapshot(&source)?,password)?
            } else {
                restore_bundle(&source, &directory, password)?
            }
        } else if generation > 0 {
            decode(&read_snapshot(&path(&directory,generation))?,password)?
        } else {
            if password.expose_secret().chars().count() < 12 { return Err("Choose a password with at least 12 characters.".into()); }
            let identity = x25519::Identity::generate();
            let wrapped = age::encrypt(&age::scrypt::Recipient::new(password),identity.to_string().expose_secret().as_bytes()).map_err(message)?;
            (identity,STANDARD.encode(wrapped),r#"{"entries":[],"calendar":"gregory"}"#.into())
        };
        let mut session = Session { directory, _writer: writer, identity, wrapped_identity, generation };
        if generation == 0 || restoring { commit(&mut session,&contents)?; }
        *state = Some(session);
        Ok(contents)
    }).await.map_err(message)?
}

#[tauri::command]
pub async fn save_archive(app: AppHandle, contents: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let archive = app.state::<Archive>();
        let mut state = archive.0.lock().map_err(message)?;
        commit(
            state.as_mut().ok_or("Unlock the notebook before saving.")?,
            &contents,
        )
    })
    .await
    .map_err(message)?
}

#[tauri::command]
pub async fn choose_backup() -> Result<Option<PathBuf>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .add_filter("Fragments backup", &["fragments", "json"])
            .pick_file()
    })
    .await
    .map_err(message)
}

#[tauri::command]
pub async fn backup_archive(app: AppHandle) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(destination) = rfd::FileDialog::new()
            .set_file_name("notebook.fragments")
            .add_filter("Fragments backup", &["fragments"])
            .save_file()
        else {
            return Ok(false);
        };
        let archive = app.state::<Archive>();
        let state = archive.0.lock().map_err(message)?;
        let session = state
            .as_ref()
            .ok_or("Unlock the notebook before making a backup.")?;
        let result = write_bundle(session, &destination, |bytes| {
            let _ = app.emit("backup-bytes-written", bytes);
        });
        result.map(|()| true)
    })
    .await
    .map_err(message)?
}

#[tauri::command]
pub async fn save_readable_album(html: String) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(destination) = rfd::FileDialog::new()
            .set_file_name("fragments-album.html")
            .add_filter("HTML album", &["html"])
            .save_file()
        else {
            return Ok(false);
        };
        let mut output = OpenOptions::new().write(true).create_new(true).open(&destination)
            .map_err(|error| format!("Choose a new album filename. {error}"))?;
        let result = output.write_all(html.as_bytes()).and_then(|()| output.sync_all());
        drop(output);
        if let Err(error) = result {
            let _ = fs::remove_file(destination);
            return Err(message(error));
        }
        Ok(true)
    }).await.map_err(message)?
}

struct BackupWriter<W, F> {
    writer: W,
    progress: F,
    written: u64,
    last_report: std::time::Instant,
}

impl<W: Write, F: FnMut(u64)> Write for BackupWriter<W, F> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        let count = self.writer.write(bytes)?;
        self.written += count as u64;
        if self.last_report.elapsed().as_millis() >= 500 {
            (self.progress)(self.written);
            self.last_report = std::time::Instant::now();
        }
        Ok(count)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.writer.flush()
    }
}

fn write_bundle(session: &Session, destination: &Path, mut progress: impl FnMut(u64)) -> Result<(), String> {
    if destination.try_exists().map_err(message)? {
        return Err("Choose a new backup filename.".into());
    }
    let snapshot = path(&session.directory, session.generation);
    let envelope: Snapshot = serde_json::from_str(&read_snapshot(&snapshot)?).map_err(message)?;
    let encrypted = STANDARD.decode(envelope.notebook).map_err(message)?;
    let contents = String::from_utf8(age::decrypt(&session.identity, &encrypted).map_err(message)?)
        .map_err(message)?;
    let items = super::media::objects(&contents)?;
    let parent = destination.parent().filter(|path| !path.as_os_str().is_empty()).unwrap_or(Path::new("."));
    let mut output = tempfile::Builder::new()
        .prefix(".fragments-backup-")
        .suffix(".partial")
        .tempfile_in(parent)
        .map_err(message)?;
    progress(0);
    let mut bundle = tar::Builder::new(BackupWriter {
        writer: output.as_file_mut(),
        progress,
        written: 0,
        last_report: std::time::Instant::now(),
    });
    bundle.append_path_with_name(snapshot, "notebook.json").map_err(message)?;
    let mut seen = std::collections::HashSet::new();
    for item in items {
        if seen.insert(item.id.clone()) {
            let name = format!("media/{}.age", item.id);
            bundle.append_path_with_name(session.directory.join(&name), &name)
                .map_err(|error| format!("Could not back up {name}. {error}"))?;
        }
    }
    let mut finished = bundle.into_inner().map_err(message)?;
    (finished.progress)(finished.written);
    finished.writer.sync_all().map_err(message)?;
    output.persist_noclobber(destination).map_err(message)?;
    Ok(())
}

fn restore_bundle(
    source: &Path,
    directory: &Path,
    password: SecretString,
) -> Result<(x25519::Identity, String, String), String> {
    let mut archive = tar::Archive::new(File::open(source).map_err(message)?);
    let mut entries = archive.entries().map_err(message)?;
    let entry = entries
        .next()
        .ok_or("The backup is empty.")?
        .map_err(message)?;
    if entry.path().map_err(message)?.as_ref() != Path::new("notebook.json")
        || !entry.header().entry_type().is_file()
        || entry.size() > MAX_FILE
    {
        return Err("The backup does not start with a valid notebook snapshot.".into());
    }
    let mut document = String::new();
    entry
        .take(MAX_FILE + 1)
        .read_to_string(&mut document)
        .map_err(message)?;
    let decoded = decode(&document, password)?;
    let mut required: std::collections::HashSet<_> = super::media::objects(&decoded.2)?
        .into_iter()
        .map(|item| format!("media/{}.age", item.id))
        .collect();
    fs::create_dir_all(directory.join("media")).map_err(message)?;
    let staging = tempfile::Builder::new().prefix(".restore-").tempdir_in(directory).map_err(message)?;
    fs::create_dir(staging.path().join("media")).map_err(message)?;
    let mut created = Vec::new();
    let result = (|| {
        let mut verified = Vec::new();
        for entry in entries {
            let mut entry = entry.map_err(message)?;
            let path = entry
                .path()
                .map_err(message)?
                .to_string_lossy()
                .replace('\\', "/");
            if !entry.header().entry_type().is_file() || !required.remove(&path) {
                return Err("The backup contains an unexpected attachment.".into());
            }
            let target = staging.path().join(&path);
            let mut output = OpenOptions::new()
                .create_new(true)
                .write(true)
                .open(&target)
                .map_err(message)?;
            io::copy(&mut entry, &mut output).map_err(message)?;
            output.sync_all().map_err(message)?;
            drop(output);
            super::media::verify_object(&target, &decoded.0)?;
            verified.push(path);
        }
        if !required.is_empty() {
            return Err("The backup is missing media files.".into());
        }
        for path in &verified {
            if directory.join(path).try_exists().map_err(message)? {
                return Err("An attachment already exists in the restore folder.".into());
            }
        }
        for path in verified {
            let target = directory.join(&path);
            fs::rename(staging.path().join(path), &target).map_err(message)?;
            created.push(target);
        }
        Ok(decoded)
    })();
    if result.is_err() {
        for path in created {
            let _ = fs::remove_file(path);
        }
    }
    result
}

#[tauri::command]
pub fn lock_archive(archive: tauri::State<'_, Archive>) -> Result<(), String> {
    *archive.0.lock().map_err(message)? = None;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn committed_snapshot_restores_text_photo_and_calendar() {
        let directory = std::env::temp_dir().join(format!(
            "fragments-test-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir(&directory).unwrap();
        let writer = File::create(directory.join("writer.lock")).unwrap();
        writer.try_lock().unwrap();
        let password = SecretString::from("fictional notebook password".to_owned());
        let identity = x25519::Identity::generate();
        let wrapped = age::encrypt(
            &age::scrypt::Recipient::new(password.clone()),
            identity.to_string().expose_secret().as_bytes(),
        )
        .unwrap();
        let mut session = Session {
            directory: directory.clone(),
            _writer: writer,
            identity,
            wrapped_identity: STANDARD.encode(wrapped),
            generation: 0,
        };
        let initial = r#"{"entries":[],"calendar":"gregory"}"#;
        let edited = r#"{"entries":[{"id":"sample","title":"کنار دریا","text":"A memory with Sara","chapter":"Test","date":"2024-08-18","imageUrl":"data:image/png;base64,AAAA"}],"calendar":"persian"}"#;
        commit(&mut session, initial).unwrap();
        commit(&mut session, edited).unwrap();
        fs::write(directory.join("writing.tmp"), b"incomplete").unwrap();
        drop(session);
        assert_eq!(latest(&directory).unwrap(), 2);
        let encrypted = read_snapshot(&path(&directory, 2)).unwrap();
        assert!(!encrypted.contains("A memory with Sara"));
        assert_eq!(decode(&encrypted, password).unwrap().2, edited);
        for file in [
            "writer.lock",
            "writing.tmp",
            "snapshot-1.json",
            "snapshot-2.json",
        ] {
            fs::remove_file(directory.join(file)).unwrap();
        }
        fs::remove_dir(directory).unwrap();
    }

    #[test]
    fn media_backup_restores_and_serves_a_video_range() {
        let root =
            std::env::temp_dir().join(format!("fragments-media-test-{}", uuid::Uuid::new_v4()));
        let directory = root.join("original");
        let restored = root.join("restored");
        fs::create_dir_all(directory.join("media")).unwrap();
        let writer = File::create(directory.join("writer.lock")).unwrap();
        let identity = x25519::Identity::generate();
        let password = SecretString::from("media archive test password".to_owned());
        let mut recipient = age::scrypt::Recipient::new(password.clone());
        recipient.set_work_factor(12);
        let wrapped =
            age::encrypt(&recipient, identity.to_string().expose_secret().as_bytes()).unwrap();
        let mut session = Session {
            directory,
            _writer: writer,
            identity,
            wrapped_identity: STANDARD.encode(wrapped),
            generation: 0,
        };
        let ids = [
            uuid::Uuid::new_v4().to_string(),
            uuid::Uuid::new_v4().to_string(),
        ];
        let bytes: Vec<u8> = (0..150_000).map(|n| (n % 251) as u8).collect();
        for id in &ids {
            fs::write(
                session.directory.join("media").join(format!("{id}.age")),
                age::encrypt(&session.identity.to_public(), &bytes).unwrap(),
            )
            .unwrap();
        }
        let contents = serde_json::json!({"calendar":"gregory","entries":[{
            "id":"entry","title":"Two attachments","text":"","date":"","chapter":"Test",
            "media":[{"id":ids[0],"mime":"image/png","caption":"Photo"},{"id":ids[1],"mime":"video/mp4","caption":"Video"}],"cover":ids[0]
        }]}).to_string();
        commit(&mut session, &contents).unwrap();
        let backup = root.join("test.fragments");
        let mut reported = 0;
        write_bundle(&session, &backup, |bytes| reported = bytes).unwrap();
        assert_eq!(reported, fs::metadata(&backup).unwrap().len());
        assert!(write_bundle(&session, &backup, |_| {}).is_err());
        let media_path = session.directory.join("media").join(format!("{}.age", ids[0]));
        let parked = media_path.with_extension("parked");
        fs::rename(&media_path, &parked).unwrap();
        let incomplete = root.join("incomplete.fragments");
        assert!(write_bundle(&session, &incomplete, |_| {}).is_err());
        assert!(!incomplete.exists());
        assert!(!fs::read_dir(&root).unwrap().any(|entry|
            entry.unwrap().path().extension().is_some_and(|ext| ext == "partial")
        ));
        fs::rename(&parked, &media_path).unwrap();
        let (identity, wrapped_identity, reopened) =
            restore_bundle(&backup, &restored, password).unwrap();
        assert_eq!(reopened, contents);
        let writer = File::create(restored.join("writer.lock")).unwrap();
        let restored_session = Session {
            directory: restored,
            _writer: writer,
            identity,
            wrapped_identity,
            generation: 0,
        };
        let request = tauri::http::Request::builder()
            .uri(format!("http://notebook-media.localhost/{}/mp4", ids[1]))
            .header("Range", "bytes=65530-65590")
            .body(vec![])
            .unwrap();
        let response = super::super::media::playback(&restored_session, &request).unwrap();
        assert_eq!(response.status(), 206);
        assert_eq!(response.body(), &bytes[65530..65591]);
        drop(restored_session);
        drop(session);
        for name in ["original", "restored"] {
            let directory = root.join(name);
            for id in &ids {
                fs::remove_file(directory.join("media").join(format!("{id}.age"))).unwrap();
            }
            fs::remove_dir(directory.join("media")).unwrap();
            fs::remove_file(directory.join("writer.lock")).unwrap();
            if name == "original" {
                fs::remove_file(path(&directory, 1)).unwrap();
            }
            fs::remove_dir(directory).unwrap();
        }
        fs::remove_file(backup).unwrap();
        fs::remove_dir(root).unwrap();
    }
}
