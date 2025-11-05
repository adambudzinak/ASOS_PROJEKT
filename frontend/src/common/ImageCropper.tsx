import React, { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import ReactCrop, {
    centerCrop,
    convertToPixelCrop,
    makeAspectCrop
} from "react-image-crop";
import type { PercentCrop } from "react-image-crop";
import setCanvasPreview from "./setCanvasPreview";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperProps {
    closeModal: () => void;
    updateAvatar: (image: string | File, tags?: string) => void;
    forType?: "avatar" | "photo" | null;
}

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

const ImageCropper: React.FC<ImageCropperProps> = ({ closeModal, updateAvatar, forType }) => {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [imgSrc, setImgSrc] = useState<string>("");
    const [crop, setCrop] = useState<PercentCrop>();
    const [error, setError] = useState<string>("");
    const [tagInput, setTagInput] = useState<string>("");

    const onSelectFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener("load", () => {
            const imageElement = new Image();
            const imageUrl = reader.result?.toString() || "";
            imageElement.src = imageUrl;

            imageElement.addEventListener("load", (e) => {
                const target = e.currentTarget as HTMLImageElement;
                const { naturalWidth, naturalHeight } = target;

                if (naturalWidth < MIN_DIMENSION || naturalHeight < MIN_DIMENSION) {
                    setError("Picture needs to have at least 150x150 pixels.");
                    setImgSrc("");
                    return;
                }

                setError("");
            });

            setImgSrc(imageUrl);
        });
        reader.readAsDataURL(file);
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

        const initialCrop = makeAspectCrop(
            {
                unit: "%",
                width: cropWidthInPercent,
            },
            ASPECT_RATIO,
            width,
            height
        );

        const centered = centerCrop(initialCrop, width, height);
        setCrop(centered);
    };

    const handleCrop = () => {
        if (!imgRef.current || !previewCanvasRef.current || !crop) return;

        setCanvasPreview(
            imgRef.current,
            previewCanvasRef.current,
            convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height)
        );

        if (forType === "avatar") {
            // avatar → base64
            const dataUrl = previewCanvasRef.current.toDataURL("image/png");
            updateAvatar(dataUrl);
        } else if (forType === "photo") {
            // photo → blob / file
            previewCanvasRef.current.toBlob((blob) => {
                if (!blob) return;
                const file = new File([blob], "photo.png", { type: "image/png" });
                updateAvatar(file, tagInput);
            }, "image/png");
        }

        closeModal();
    };

    return (
        <div className="d-flex flex-column align-items-center">
            <div className="mb-3">
                <label className="form-label fw-semibold">Choose picture</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    className="form-control form-control-sm"
                />
            </div>

            {error && <p className="text-danger small">{error}</p>}

            {imgSrc && (
                <div className="d-flex flex-column align-items-center">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        circularCrop={forType === "avatar"}
                        keepSelection
                        aspect={ASPECT_RATIO}
                        minWidth={MIN_DIMENSION}
                    >
                        <img
                            ref={imgRef}
                            src={imgSrc}
                            alt="Upload"
                            style={{ maxHeight: "70vh", borderRadius: "8px" }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                    {forType === "photo" && (
                        <div className="mt-3 text-center w-100">
                            <label className="form-label fw-semibold">Add tags (separated by spaces)</label>
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="e.g. travel friends sunset"
                                className="form-control text-center"
                            />
                        </div>
                    )}
                    <button
                        className="glass-button"
                        onClick={handleCrop}
                        disabled={!crop}
                    >
                        Crop & Upload this image
                    </button>
                </div>
            )}

            <canvas
                ref={previewCanvasRef}
                style={{
                    display: "none",
                    border: "1px solid #ccc",
                    objectFit: "contain",
                    width: 150,
                    height: 150,
                }}
            />
        </div>
    );
};

export default ImageCropper;
