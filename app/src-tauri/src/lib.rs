mod archive;
mod media;

pub fn run() {
    tauri::Builder::default()
        .manage(archive::Archive::default())
        .register_asynchronous_uri_scheme_protocol(
            "notebook-media",
            |context, request, responder| {
                media::serve(context.app_handle().clone(), request, responder);
            },
        )
        .invoke_handler(tauri::generate_handler![
            archive::archive_exists,
            archive::open_archive,
            archive::save_archive,
            archive::backup_archive,
            archive::choose_backup,
            archive::save_readable_album,
            media::import_media,
            media::read_album_media,
            archive::lock_archive
        ])
        .run(tauri::generate_context!())
        .expect("could not start Fragments");
}

#[cfg(test)]
mod tests {
    use age::{Decryptor, Identity, secrecy::SecretString, x25519};
    use std::io::{Cursor, Read, Seek, SeekFrom};

    #[test]
    fn password_wrapper_reopens_portable_bytes() {
        let password = SecretString::from("fictional proof password".to_owned());
        let recipient = age::scrypt::Recipient::new(password.clone());
        let identity = age::scrypt::Identity::new(password);
        let writing = "An afternoon by the sea. کنار دریا".as_bytes();
        let encrypted = age::encrypt(&recipient, writing).unwrap();
        assert_eq!(age::decrypt(&identity, &encrypted).unwrap(), writing);
        let mut damaged = encrypted;
        let last = damaged.last_mut().unwrap();
        *last ^= 1;
        assert!(age::decrypt(&identity, &damaged).is_err());
    }

    #[test]
    fn encrypted_reader_seeks_across_chunks() {
        let identity = x25519::Identity::generate();
        let bytes: Vec<u8> = (0..200_000).map(|n| (n % 251) as u8).collect();
        let encrypted = age::encrypt(&identity.to_public(), &bytes).unwrap();
        let decryptor = Decryptor::new_buffered(Cursor::new(encrypted)).unwrap();
        let mut reader = decryptor
            .decrypt(std::iter::once(&identity as &dyn Identity))
            .unwrap();

        for position in [65_530, 130_950, 21] {
            let mut sample = [0; 40];
            reader.seek(SeekFrom::Start(position as u64)).unwrap();
            reader.read_exact(&mut sample).unwrap();
            assert_eq!(sample, bytes[position..position + sample.len()]);
        }
    }
}
