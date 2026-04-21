package com.campus.modules.tickets.storage;

import com.campus.common.exception.BadRequestException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

// Saves and loads ticket image attachments on the local disk.
//
// We keep this very simple:
//   - the upload folder comes from application.properties (app.storage.upload-dir)
//   - we only allow PNG, JPEG and WEBP images
//   - each file must be 2 MB or smaller
//   - we never trust the original filename - we generate a UUID instead
//
// In Docker the upload-dir is mapped to a host volume, so files
// stay safe across container restarts.
@Service
public class FileStorageService {

    // Image types we accept. Anything else gets rejected with a 400.
    private static final List<String> ALLOWED_TYPES = List.of(
        "image/png",
        "image/jpeg",
        "image/webp"
    );

    // 2 MB limit per file. Spring also enforces this via multipart settings,
    // but we double-check here so the error message is friendlier.
    private static final long MAX_FILE_SIZE_BYTES = 2L * 1024L * 1024L;

    // Where the files are stored. Resolved to an absolute path on startup.
    private final Path rootFolder;

    public FileStorageService(@Value("${app.storage.upload-dir}") String uploadDir) {
        this.rootFolder = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Make sure the folder exists. If we can't create it the app should
        // fail fast at startup, not later when a user tries to upload.
        try {
            Files.createDirectories(rootFolder);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload folder at " + rootFolder, e);
        }
    }

    // Save one uploaded file to disk and return the safe filename we used.
    // The caller (TicketService) stores this filename inside the Ticket document.
    public String save(MultipartFile file) {
        validate(file);

        // Build a safe filename. We never trust what the user sent us.
        String extension = pickExtension(file);
        String safeName = UUID.randomUUID() + extension;

        Path targetPath = rootFolder.resolve(safeName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Failed to save attachment");
        }

        return safeName;
    }

    // Load a stored file as a Spring Resource so a controller can stream it
    // back to the browser. The caller must check permissions BEFORE calling
    // this method - this class only knows about files, not who is allowed
    // to see them.
    public Resource load(String filename) {
        Path filePath = rootFolder.resolve(filename).normalize();

        // Block "../" path traversal attacks. If a user sends "../etc/passwd"
        // the resolved path will not start with our root folder, and we refuse.
        if (!filePath.startsWith(rootFolder)) {
            throw new BadRequestException("Invalid attachment path");
        }

        if (!Files.exists(filePath)) {
            throw new BadRequestException("Attachment not found");
        }

        try {
            return new UrlResource(filePath.toUri());
        } catch (MalformedURLException e) {
            throw new BadRequestException("Could not read attachment");
        }
    }

    // Best-effort delete. We don't care if it fails - the database is the
    // source of truth, and a leftover file on disk is not a bug worth crashing for.
    public void delete(String filename) {
        try {
            Path filePath = rootFolder.resolve(filename).normalize();
            if (filePath.startsWith(rootFolder)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {
            // Just leave the file. A janitor job can clean it up later.
        }
    }

    // Look up the MIME type so a controller can set the right Content-Type
    // header when streaming the file back.
    public String detectContentType(String filename) {
        try {
            Path filePath = rootFolder.resolve(filename).normalize();
            String type = Files.probeContentType(filePath);
            return type != null ? type : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    // ---------- private helpers ----------

    // Reject anything that is not a small image we support.
    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Attachment file is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Image is too large (max 2 MB)");
        }

        String type = file.getContentType();
        if (type == null || !ALLOWED_TYPES.contains(type.toLowerCase())) {
            throw new BadRequestException("Only PNG, JPEG or WEBP images are allowed");
        }
    }

    // Pick a safe extension based on the content type. We do NOT trust the
    // original filename's extension because users can rename anything.
    // The default branch is unreachable in normal flow (validateAllowedTypes
    // rejects anything else first), but we fail loudly if that guarantee ever
    // breaks — better than saving files with no extension.
    private String pickExtension(MultipartFile file) {
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        return switch (type) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            default -> throw new BadRequestException("Unsupported image type: " + type);
        };
    }
}
