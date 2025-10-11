import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { ImageFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// --- IDEASPARK SERVICE ---

const ideaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A catchy name for the product.'
    },
    concept: {
      type: Type.STRING,
      description: 'A detailed one-paragraph description that captures the essence of the idea.'
    },
    keyFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of 3-5 standout features.'
    },
    styleAndAesthetics: {
      type: Type.STRING,
      description: 'Describe the visual style (e.g., "Minimalist, Scandinavian-inspired, with natural wood tones").'
    },
    suggestedMaterials: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of suitable materials.'
    },
    targetAudience: {
      type: Type.STRING,
      description: 'Who this product would be perfect for.'
    },
    category: {
      type: Type.STRING,
      description: 'The single best category for this product from the following list: Accessory, Art, Bags, Clothing, Footwear, Furniture, Gadget, Home Decor, Jewelry, Kitchenware, Lighting, Print, Stationery, Toy.'
    }
  },
  required: ['title', 'concept', 'keyFeatures', 'styleAndAesthetics', 'suggestedMaterials', 'targetAudience', 'category']
};

export async function generateIdeaFromPrompt(prompt: string, image?: ImageFile | null) {
  const systemInstruction = `You are 'IdeaSpark', an expert creative consultant specializing in helping people bring their product ideas to life. A user will provide you with a concept, which may be vague and include text, and optionally an image. Your task is to transform their input into a clear, compelling, and actionable product concept based on the provided JSON schema. Focus on creating innovative yet practical and manufacturable product designs.`;
  
  const parts: any[] = [{ text: prompt }];
  if (image) {
    parts.unshift({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: ideaResponseSchema,
      },
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error generating idea from Gemini:", error);
    throw new Error("Failed to generate idea. Please check your prompt and try again.");
  }
}

// --- WORKBENCH SERVICE ---

const dataUrlToGenerativePart = (dataUrl: string) => {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
  return { inlineData: { data, mimeType } };
};

export const generateInitialImages = async (prompt: string, negativePrompt?: string): Promise<string[]> => {
  try {
    let fullPrompt = `professional product photograph of ${prompt}. The product is centered, on a clean, neutral studio background (light gray, #f0f0f0). 8k, sharp focus, studio lighting, high detail.`;
    
    let negativePromptContent = "no people, no hands, no text, no distracting elements, no shadows";
    if (negativePrompt) {
      negativePromptContent += `, ${negativePrompt}`;
    }
    
    fullPrompt += ` Negative prompt: ${negativePromptContent}.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    }
    throw new Error('No images were generated.');
  } catch (error) {
    console.error("Error generating initial images:", error);
    throw new Error("Failed to generate images. Please check your prompt and API key.");
  }
};

export const editImageWithMask = async (baseImageUrl: string, maskDataUrl: string, prompt: string, mode: 'replace' | 'add'): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(baseImageUrl);
    const maskPart = dataUrlToGenerativePart(maskDataUrl);

    let systemPrompt: string;
    if (mode === 'add') {
      systemPrompt = `You are a high-precision digital artist. Your task is to perform a targeted edit on the provided 'base image' using the second image as a 'mask'. The masked area indicates *where* to apply the change. **Your goal is to subtly add or modify a detail, not replace the entire region.** The existing content under the mask should be preserved as much as possible, with the new detail seamlessly blended on top of or into it. Apply this specific instruction: "${prompt}". The transparent, unmasked area of the mask MUST remain completely unchanged and pixel-perfect. Respond with only the final, edited image.`;
    } else { // 'replace' mode
      systemPrompt = `You are an expert digital artist. Your task is to edit the provided 'base image' using the second image as a 'mask'. The area to be edited is indicated by the colored pixels in the mask. **Your goal is to completely replace the content within the masked region** based on the following instruction: "${prompt}". The transparent, unmasked area of the mask MUST remain completely unchanged and pixel-perfect. Respond with only the final, edited image.`;
    }

    const textPart = { text: systemPrompt };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, maskPart, textPart] },
      config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No edited image was returned from the API.');
};

export const applyStyleToImage = async (baseImageUrl: string, stylePrompt: string): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(baseImageUrl);
    const textPart = { text: `You are a master artist. Your task is to reinterpret the given image in a new artistic style, as described here: "${stylePrompt}". It is crucial that the core subject matter, composition, and key elements of the original image are preserved. Return only the new, stylized image.` };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error('No styled image was returned from the API.');
};

export const getAIFeedbackForImage = async (baseImageUrl: string, originalPrompt: string): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(baseImageUrl);
    const textPart = { text: `You are a world-class product design critic from a prestigious design firm, tasked with reviewing an image generated from the prompt: "${originalPrompt}". Your feedback should be insightful, professional, and brutally honest, but always constructive. Analyze the image's adherence to the prompt, its aesthetic appeal, and commercial viability. Identify strengths and weaknesses. Conclude with 2-3 specific, actionable alternative prompts for a superior V2. Format your response in markdown with clear headings for "Critique" and "Suggested Prompts".` };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }
    });
    return response.text;
};

export const generateImageViewFromAngle = async (baseImageUrl: string, angle: string): Promise<string> => {
    const imagePart = dataUrlToGenerativePart(baseImageUrl);
    const textPart = { text: `You are an expert 3D product visualizer. Your task is to regenerate the provided product image from a new camera angle. The new angle should be: "${angle}". **Crucial Rules:** 1. **Preserve Product:** The product's design, materials, and details must remain identical. 2. **Preserve Environment:** The clean, neutral studio background and lighting must be perfectly preserved. 3. **Change Angle Only:** The only change should be the camera's perspective on the object. Do not add, remove, or change any elements. 4. **Output:** Return ONLY the newly rendered image.` };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No new view was returned from the API.');
};


// --- FITCHECK & HOME CANVAS UTILS ---

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    return dataUrlToGenerativePart(dataUrl);
};

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked. Reason: ${response.promptFeedback.blockReason}.`);
    }

    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
    }

    throw new Error(`The AI model did not return an image. This can happen due to safety filters or if the request is too complex.`);
};


// --- FITCHECK SERVICE ---

export const generateModelImage = async (userImage: File): Promise<string> => {
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a photorealistic, full-body fashion model photo for an e-commerce website. **Crucial Rules:** 1. **Background:** Change the background to a clean, neutral studio backdrop (light gray, #f0f0f0) with soft, even lighting and no harsh shadows. 2. **Pose:** Adjust the person's pose to a standard, relaxed standing model pose. 3. **Preserve Identity:** It is absolutely essential to preserve the person's identity, including all facial features, hair, skin tone, and body type. DO NOT alter their face or body proportions. The goal is a realistic photo of the same person in a different context. 4. **Output:** Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [userImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageUrl: string, garmentImage: File, category: string): Promise<string> => {
    const modelImagePart = dataUrlToGenerativePart(modelImageUrl);
    const garmentImagePart = await fileToPart(garmentImage);
    
    const lowerCaseCategory = category.toLowerCase();
    const isAccessory = lowerCaseCategory.includes('jewelry') || lowerCaseCategory.includes('accessory');

    let prompt: string;

    if (isAccessory) {
        prompt = `You are an expert virtual try-on AI for accessories. You will be given a 'model image' and an 'item image' (which is a piece of jewelry or an accessory). Your task is to realistically **place** this item onto the person in the 'model image'. **Crucial Rules:** 1. **DO NOT CHANGE CLOTHING:** The person's existing clothing MUST remain completely unchanged. 2. **ACCURATE PLACEMENT:** Intelligently identify the correct location for the item. For example, place earrings on the earlobes, necklaces around the neck, hats on the head, glasses on the face. 3. **PRESERVE THE MODEL:** The person's face, hair, body, and pose MUST remain unchanged. 4. **REALISTIC COMPOSITION:** Pay close attention to scale, perspective, lighting, and how the item would naturally sit or hang. Add realistic shadows or reflections where appropriate. 5. **Output:** Return ONLY the final, edited image.`;
    } else { // Default to clothing
        prompt = `You are an expert virtual try-on AI for clothing. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'. **Crucial Rules:** 1. **COMPLETE GARMENT REPLACEMENT:** You MUST completely REMOVE and REPLACE the corresponding clothing item worn by the person in the 'model image' with the new garment. 2. **PRESERVE THE MODEL:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged. 3. **PRESERVE THE BACKGROUND:** The entire background from the 'model image' MUST be preserved perfectly. 4. **APPLY THE GARMENT:** Realistically fit the new garment onto the person. Pay close attention to fabric drape, shadows, and how the garment naturally conforms to the person's body and pose. 5. **Output:** Return ONLY the final, edited image.`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageUrl: string, poseInstruction: string): Promise<string> => {
    const tryOnImagePart = dataUrlToGenerativePart(tryOnImageUrl);
    const prompt = `You are a master fashion photographer AI. Your task is to reshoot the provided image of a person from a new camera angle. **New Pose/Angle Instruction:** "${poseInstruction}". **Strict Rules to Follow:** 1. **Identity Preservation:** The person's facial features, hair, skin tone, and body type must remain identical to the original image. 2. **Clothing Consistency:** The clothing worn by the person, including its fit, texture, and color, must be perfectly preserved. 3. **Background Consistency:** The background environment and lighting must be identical to the original image. 4. **Only Change Pose:** The only modification is the person's pose and the camera's viewpoint to match the instruction. 5. **Output:** Return ONLY the final image, with no text or other artifacts.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    return handleApiResponse(response);
};

export const generateGarmentFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const fullPrompt = `High-resolution, studio-quality photorealistic image of a single clothing item: "${prompt}". The item must be presented flat on a pure white background (#FFFFFF), as if for a luxury e-commerce product page. The lighting should be even and soft, clearly showing the texture and details of the fabric. There must be no models, mannequins, or shadows. The image must clearly show the entire garment.`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    throw new Error('No image was generated for the garment.');
  } catch (error) {
    console.error("Error generating garment from prompt:", error);
    throw new Error("Failed to generate garment. The prompt might have been rejected for safety reasons.");
  }
};

// --- HOME CANVAS SERVICE ---

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
});

const resizeImage = (file: File, targetDimension: number): Promise<File> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetDimension;
        canvas.height = targetDimension;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, targetDimension, targetDimension);
        const ar = img.width / img.height;
        const [w, h] = ar > 1 ? [targetDimension, targetDimension / ar] : [targetDimension * ar, targetDimension];
        ctx.drawImage(img, (targetDimension - w) / 2, (targetDimension - h) / 2, w, h);
        canvas.toBlob(b => b ? resolve(new File([b], file.name, { type: 'image/jpeg' })) : reject('Blob creation failed'), 'image/jpeg', 0.95);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
});

const markImage = async (paddedFile: File, pos: { xPercent: number; yPercent: number; }, origDims: { width: number; height: number; }): Promise<File> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const dim = canvas.width = canvas.height = img.width;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0);
        const ar = origDims.width / origDims.height;
        const [w, h] = ar > 1 ? [dim, dim / ar] : [dim * ar, dim];
        const [offX, offY] = [(dim - w) / 2, (dim - h) / 2];
        const [finalX, finalY] = [offX + (pos.xPercent / 100) * w, offY + (pos.yPercent / 100) * h];
        ctx.beginPath();
        ctx.arc(finalX, finalY, Math.max(5, dim * 0.015), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.lineWidth = Math.max(1, dim * 0.003);
        ctx.strokeStyle = 'white';
        ctx.stroke();
        canvas.toBlob(b => b ? resolve(new File([b], `marked-${paddedFile.name}`, { type: 'image/jpeg' })) : reject('Blob failed'), 'image/jpeg');
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(paddedFile);
});

const cropToOriginalAspectRatio = (imageDataUrl: string, originalWidth: number, originalHeight: number, targetDimension: number): Promise<string> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
        const ar = originalWidth / originalHeight;
        const [contentWidth, contentHeight] = ar > 1 ? [targetDimension, targetDimension / ar] : [targetDimension * ar, targetDimension];
        const [x, y] = [(targetDimension - contentWidth) / 2, (targetDimension - contentHeight) / 2];
        const canvas = document.createElement('canvas');
        canvas.width = contentWidth;
        canvas.height = contentHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, x, y, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
});


export const generateCompositeImage = async (objectImage: File, objectDescription: string, environmentImage: File, environmentDescription: string, dropPosition: { xPercent: number; yPercent: number; }): Promise<{ finalImageUrl: string; debugImageUrl: string; finalPrompt: string; }> => {
  const MAX_DIMENSION = 1024;
  const originalDims = await getImageDimensions(environmentImage);

  const resizedObjectImage = await resizeImage(objectImage, MAX_DIMENSION);
  const resizedEnvironmentImage = await resizeImage(environmentImage, MAX_DIMENSION);
  const markedResizedEnvironmentImage = await markImage(resizedEnvironmentImage, dropPosition, originalDims);
  const debugImageUrl = URL.createObjectURL(markedResizedEnvironmentImage);

  const markedEnvironmentImagePart = await fileToPart(markedResizedEnvironmentImage);
  const descriptionPrompt = `You are an expert scene analyst AI. I am providing an image with a red marker. Your task is to provide a dense, semantic description of the 3D space at the exact location of the red marker. Be specific. What is the surface type (e.g., horizontal floor, vertical wall)? What is it made of (e.g., wood, glass, concrete)? How is it lit (e.g., direct sunlight, soft shadow)? Are there nearby objects that might cast shadows or reflections? This description will guide another AI in placing a new object realistically. Provide only the description in a few detailed sentences.`;
  
  const descriptionResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [{ text: descriptionPrompt }, markedEnvironmentImagePart] }});
  const semanticLocationDescription = descriptionResponse.text;

  const objectImagePart = await fileToPart(resizedObjectImage);
  const cleanEnvironmentImagePart = await fileToPart(resizedEnvironmentImage);
  
  const finalPrompt = `**Role:** You are a photorealistic composition expert. Your task is to take a 'product' image and seamlessly integrate it into a 'scene' image, adjusting for perspective, lighting, and scale to create a photorealistic composite. **Specifications:** - **Product to add:** The first image provided. Ignore any black padding around it; focus on the object itself. - **Scene to use:** The second image provided. This is the environment for the product. - **Placement Instruction (Crucial):** You must place the product at this exact location within the scene: "${semanticLocationDescription}". - **Final Image Requirements:** The output must match the scene's style, lighting, shadows, and perspective. Re-render the product to fit naturally. Scale it appropriately and cast realistic shadows. If the surface is reflective (e.g., glass, polished metal), add a subtle, realistic reflection of the product. The output should ONLY be the final, composed image.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [objectImagePart, cleanEnvironmentImagePart, { text: finalPrompt }] },
    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] }
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (imagePart?.inlineData) {
      const generatedSquareUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      const finalImageUrl = await cropToOriginalAspectRatio(generatedSquareUrl, originalDims.width, originalDims.height, MAX_DIMENSION);
      return { finalImageUrl, debugImageUrl, finalPrompt };
  }
  throw new Error("The AI model did not return an image.");
};