import {getFs, getHosting, getKv} from "./puter.action";
import {
    createHostingSlug,
    fetchBlobFromUrl, getHostedUrl,
    getImageExtension,
    HOSTING_CONFIG_KEY,
    imageUrlToPngBlob,
    isHostedUrl
} from "./utils";

type HostingConfig = {subdomain: string;};
type HostedAsset = {url: string};
export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
    const existing =(await getKv().get(HOSTING_CONFIG_KEY)) as HostingConfig | null;
    if(existing?.subdomain) return {subdomain: existing.subdomain};

    const subdomain= createHostingSlug();
    try {
        const created = await getHosting().create(subdomain, '.');
        return{subdomain: created.subdomain,};
    }
    catch (e){
        console.error(`Could not  find subdomain: ${e}`);
        return null;
    }
}

export const uploadImageToHosting = async ({ hosting, url, projectId, label}: StoreHostedImageParams): Promise<HostedAsset | null> =>{
    if(!hosting || !url) return null;
    if (isHostedUrl(url)) return {url};
    try {
        const resloved = label === "rendered" ? await imageUrlToPngBlob(url).then((blob) => blob? {blob, contentType: 'image/png'}:null):
            await fetchBlobFromUrl(url);
        if (!resloved) return null;

        const contentType = resloved.contentType || resloved.blob?.type || '';
        const ext = getImageExtension(contentType,url);
        const dir = `project/${projectId}`;
        const filePath = `${dir}/${label}.${ext}`;

        const uploadFile= new File([resloved.blob], `${label}.${ext}`,{ type: contentType});

        await getFs().mkdir(dir, {createMissingParents: true});
        await getFs().write(filePath, uploadFile);
        const hostedUrl = getHostedUrl({subdomain: hosting.subdomain},filePath);

        return hostedUrl ? {url: hostedUrl} : null;
    }catch (e){
        console.error(`Failed to store hosted image: ${e}`);
        return null;
    }

}