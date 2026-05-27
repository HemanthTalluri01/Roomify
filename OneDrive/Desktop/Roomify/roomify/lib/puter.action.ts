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

export const getCurrentUser = async () => {
    try {
        return await getPuter().auth.getUser();
    } catch {
        return null;
    }
}

export const getKv = () => getPuter().kv;
export const getFs = () => getPuter().fs;
export const getHosting = () => getPuter().hosting;

export const getProject = async (id: string): Promise<DesignItem | null> => {
    try {
        const project = await getKv().get(`project:${id}`);
        return (project as DesignItem) || null;
    } catch (e) {
        console.error(`Failed to get project ${id}:`, e);
        return null;
    }
}

export const createProject = async ({ item }: CreateProjectParams): Promise<DesignItem | null | undefined> => {
    try {
        const projectId = item.id;

        const hosting = await getOrCreateHostingConfig();

        const hostedSource = projectId ?
            await uploadImageToHosting({
                hosting, url: item.sourceImage, projectId, label: 'source',
            }) : null;

        const hostedRender = projectId && item.renderedImage ?
            await uploadImageToHosting({
                hosting, url: item.renderedImage, projectId, label: 'rendered',
            }) : null;

        const resolvedSource = hostedSource?.url || (isHostedUrl(item.sourceImage) ? item.sourceImage :
            '');

        if (!resolvedSource) {
            console.warn('Failed to host source image, skipping save.');
            return null;
        }

        const resolvedRender = hostedRender?.url ? hostedRender.url : item.renderedImage && isHostedUrl(item.renderedImage) ? item.renderedImage : undefined;

        const {
            sourcePath: _sourcePath,
            renderedPath: _renderedPath,
            publicPath: _publicPath,
            ...rest
        } = item;

        const payload = {
            ...rest,
            sourceImage: resolvedSource,
            renderedImage: resolvedRender,
        }

        //call the puter worker to store project in kv
        await getKv().set(`project:${projectId}`, payload);

        return payload;
    }
    catch (e){
        console.error('Failed to create/save project: ', e);
        return null;
    }
}