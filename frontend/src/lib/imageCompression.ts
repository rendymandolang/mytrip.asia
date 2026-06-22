type CompressOptions = {
  maxBytes: number;
  maxDimension: number;
  outputType?: string;
};

const supportedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function compressImageForUpload(
  file: File,
  options: CompressOptions,
) {
  if (!supportedImageTypes.includes(file.type)) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(
    1,
    options.maxDimension /
      Math.max(image.naturalWidth, image.naturalHeight),
  );
  let width = Math.max(
    Math.round(image.naturalWidth * scale),
    1,
  );
  let height = Math.max(
    Math.round(image.naturalHeight * scale),
    1,
  );
  const outputType = options.outputType || "image/webp";
  const originalFits =
    file.size <= options.maxBytes && scale === 1;

  if (originalFits) {
    return file;
  }

  let quality = 0.86;
  let bestFile: File | null = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const blob = await renderImage(
      image,
      width,
      height,
      outputType,
      quality,
    );
    const compressed = new File(
      [blob],
      compressedName(file.name, outputType),
      {
        type: outputType,
        lastModified: Date.now(),
      },
    );

    if (
      !bestFile ||
      compressed.size < bestFile.size
    ) {
      bestFile = compressed;
    }

    if (compressed.size <= options.maxBytes) {
      return compressed;
    }

    if (quality > 0.52) {
      quality -= 0.08;
    } else {
      width = Math.max(Math.round(width * 0.86), 1);
      height = Math.max(Math.round(height * 0.86), 1);
    }
  }

  return bestFile && bestFile.size < file.size
    ? bestFile
    : file;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image could not be loaded"));
      };

      image.src = url;
    },
  );
}

function renderImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  outputType: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error("Canvas is not available"));
      return;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error("Image compression failed"),
          );
          return;
        }

        resolve(blob);
      },
      outputType,
      quality,
    );
  });
}

function compressedName(
  filename: string,
  outputType: string,
) {
  const extension =
    outputType === "image/webp" ? "webp" : "jpg";
  const cleanBase =
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "image";

  return `${cleanBase}.${extension}`;
}
