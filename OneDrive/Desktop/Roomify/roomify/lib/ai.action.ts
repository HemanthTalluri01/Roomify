import puter from "@heyputer/puter.js";
import {ROOMIFY_RENDER_PROMPT} from "./constants";

export const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error("Failed to convert blob to data URL"));
            }
        };
        reader.onerror = () => {
            reject(new Error("FileReader error"));
        };
        reader.readAsDataURL(blob);
    });
};

export const generate3DView= async ({ sourceImage}: Generate3DViewParams) =>{
    const dataUrl = sourceImage.startsWith("data:") ? sourceImage : await fetchAsDataUrl(sourceImage);

    const base64data = dataUrl.split(',')[1];
    const mimeType= dataUrl.split(';')[0].split(':')[1];


    if(!mimeType || !base64data) throw new Error("Invalid source image payload");

    const response = await  puter.ai.txt2img(ROOMIFY_RENDER_PROMPT,{
        // `@ts-ignore`
        provider: "gemini",
        model: "gemini-2.5-flash-image-preview",
        input_image: base64data,
        input_image_mime_type: mimeType,
        ratio: { w: 1024, h: 1024 },
    }) as any;
    console.log("AI Response:", response);

    const rawImageUrl = response?.src || response?.url || (typeof response === 'string' ? response : null);

    if (!rawImageUrl) {
        console.warn("AI generation returned no image URL. Response:", response);
        return { renderedImage: null, renderedPath: undefined};
    }

    const renderedImage = rawImageUrl.startsWith('data:')
        ? rawImageUrl: await fetchAsDataUrl(rawImageUrl);

    return { renderedImage, renderedPath: undefined};



}