export const mimeTypes = {
  archives: [
    "application/zip",
    "application/x-tar",
    "application/x-rar-compressed",
    "application/gzip",
    "application/x-7z-compressed",
    "application/x-bzip",
    "application/x-bzip2",
  ],
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/vnd.microsoft.icon",
    "image/avif",
  ],
  videos: [
    "video/mp4",
    "video/x-msvideo",
    "video/mpeg",
    "video/quicktime",
    "video/x-matroska",
    "video/webm",
    "video/ogg",
    "video/3gpp",
    "video/3gpp2",
  ],
  audios: [
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "audio/aac",
    "audio/x-wav",
    "audio/x-flac",
    "audio/mp4",
    "audio/x-m4a",
  ],
  documents: [
    "application/pdf", // PDF
    "application/msword", // Microsoft Word (DOC)
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Microsoft Word (DOCX)
    "application/vnd.ms-excel", // Microsoft Excel (XLS)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Microsoft Excel (XLSX)
    "application/vnd.ms-powerpoint", // Microsoft PowerPoint (PPT)
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // Microsoft PowerPoint (PPTX)
    "text/plain", // Plain text (TXT)
    "application/rtf", // Rich Text Format (RTF)
    "text/csv", // Comma-separated values (CSV)
    "application/vnd.oasis.opendocument.text", // OpenDocument Text (ODT)
    "application/vnd.oasis.opendocument.spreadsheet", // OpenDocument Spreadsheet (ODS)
    "application/vnd.oasis.opendocument.presentation", // OpenDocument Presentation (ODP)
    "application/epub+zip", // EPUB (eBook)
    "application/x-iwork-pages-sffpages", // Apple Pages
    "application/x-iwork-keynote-sffkey", // Apple Keynote
    "application/x-iwork-numbers-sffnumbers", // Apple Numbers
  ],
};
export const isMimeTypeSupported = (type: string): boolean => {
  return Object.values(mimeTypes).some((mimeList) => mimeList.includes(type));
};
