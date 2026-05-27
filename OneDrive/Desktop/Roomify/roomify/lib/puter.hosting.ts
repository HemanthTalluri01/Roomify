import {getFs, getHosting, getKv} from "./puter.action";
import {
    createHostingSlug,
    fetchBlobFromUrl, getHostedUrl,
    getImageExtension,
    HOSTING_CONFIG_KEY,
    imageUrlToPngBlob,
    isHostedUrl
} from "./utils";
import puter from "@heyputer/puter.js";

type HostingConfig = {subdomain: string;};
type HostedAsset = {url: string};
export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    const existing = (await getKv().get(HOSTING_CONFIG_KEY)) as HostingConfig | null;
    if (existing?.subdomain) return { subdomain: existing.subdomain };

    const subdomain = createHostingSlug();
    try {
<<<<<<< HEAD
        const created = await getHosting().create(subdomain, '.');
        const config = { subdomain: created.subdomain };
        await getKv().set(HOSTING_CONFIG_KEY, config);
        return config;
    }
    catch (e){
        console.error(`Could not  find subdomain: ${e}`);
=======
        const created = await getHosting().create(subdomain, ".");
        const record = { subdomain: created.subdomain };

        await getKv().set(HOSTING_CONFIG_KEY, record);
        return record;
    } catch (e) {
        console.error(`Could not create hosting config: ${e}`);
>>>>>>> hosting-omages
        return null;
    }
};

export const uploadImageToHosting = async ({ hosting, url, projectId, label }: StoreHostedImageParams): Promise<HostedAsset | null> => {
    if (!hosting || !url) return null;
    if (isHostedUrl(url)) return { url };
    try {
        const resolved = label === "rendered" ? await imageUrlToPngBlob(url).then((blob) => blob ? { blob, contentType: 'image/png' } : null) :
            await fetchBlobFromUrl(url);
        if (!resolved) return null;

        const contentType = resolved.contentType || resolved.blob?.type || '';
        const ext = getImageExtension(contentType, url);
        const dir = `project/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile = new File([resolved.blob], `${label}.${ext}`, { type: contentType });

        await getFs().mkdir(dir, { createMissingParents: true });
        await getFs().write(filePath, uploadFile);
        const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

        return hostedUrl ? { url: hostedUrl } : null;
    } catch (e) {
        console.error(`Failed to store hosted image: ${e}`);
        return null;
    }

}