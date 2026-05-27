import puter from "@heyputer/puter.js";
import {getOrCreateHostingConfig, uploadImageToHosting} from "./puter.hosting";
import {isHostedUrl} from "./utils";

const getPuter = () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.puter) {
        return window.puter;
    }
    return puter;
};

export const signIn = async () => await getPuter().auth.signIn();
export const signOut = async () => await getPuter().auth.signOut();

export const getCurrentUser = async() =>{
    try{
        return await getPuter().auth.getUser();
    }catch {
        return null;
    }
}

export const getKv = () => getPuter().kv;
export const getFs = () => getPuter().fs;
export const getHosting = () => getPuter().hosting;

export const createProject = async ({item}: CreateProjectParams): Promise<DesignItem | null | undefined> =>{
    const projectId = item.id;

    const hosting = await getOrCreateHostingConfig();

    const hostedSource=  projectId ?
        await uploadImageToHosting({hosting, url: item.sourceImage, projectId, label: 'source',
        }): null;

    const hostedRender = projectId && item.renderedImage ?
        await uploadImageToHosting({
            hosting, url: item.renderedImage, projectId, label: 'rendered',
        }) : null;

    const reslovedSource= hostedSource?.url || (isHostedUrl(item.sourceImage)? item.sourceImage:
        '');

    if (!reslovedSource){
        console.warn('Failed to host source image, skipping save.');
        return null;
    }

    const reslovedRender = hostedRender?.url ? hostedRender.url : item.renderedImage && isHostedUrl(item.renderedImage)? item.renderedImage : undefined;

    const {
        sourcePath : _sourcePath,
        renderedPath : _renderedPath,
        publicPath: _publicPath,
        ...rest
    } = item;

    const payload= {
        ...rest,
        sourceImage: reslovedSource,
        renderedImage: reslovedRender,
    }
    try {
        //call the puter worker to store project in kv


        return payload;
    }
    catch (e){
        console.log('Failed to save project: ', e);
        return null;
    }
}