import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useParams, useOutletContext, useNavigate} from "react-router";
import {createProject, getProject} from "../../lib/puter.action";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "~/components/ui/Button";

const VisualizerId  =() =>{
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {initialImage: stateInitialImage, initialRender: stateInitialRender, name: stateName} = location.state || {};
    const {puterReady} = useOutletContext<AuthContext>();
    const hasInitialGenerated = useRef<Record<string, boolean>>({});

    const [isProcessing, setIsProcessing] = useState(false);
    const [project, setProject] = useState<DesignItem | null>(location.state || null);
    const [loading, setLoading] = useState(!location.state && puterReady);

    const initialImage = stateInitialImage || project?.sourceImage;
    const initialRender = stateInitialRender || project?.renderedImage;
    const name = stateName || project?.name;

    const [currentImage, setCurrentImage] = useState<string | null>(initialRender || null);

    useEffect(() => {
        if (id) {
            setCurrentImage(initialRender || null);
        }
    }, [id, initialRender]);

    const  handleBack = ()=> navigate('/');

    const runGeneration = async () => {
        if (!initialImage || !puterReady) return;

        try{
            setIsProcessing(true);
            const result = await generate3DView({sourceImage: initialImage});

            if (result.renderedImage){
                setCurrentImage(result.renderedImage);

                //update the project with the rendered image.
                if (project) {
                    const updatedProject = {
                        ...project,
                        renderedImage: result.renderedImage
                    };
                    const savedProject = await createProject({ item: updatedProject });
                    if (savedProject) {
                        setProject(updatedProject);
                    } else {
                        // surface a save error instead of pretending persistence succeeded
                    }
                }
            }
        }
        catch (error){
            console.error("Generation failed:", error);
        }finally {
            setIsProcessing(false);
        }

    }
    useEffect(() => {
        if (!id || !initialImage || !puterReady || hasInitialGenerated.current[id]) return;
        
        if (initialRender){
            setCurrentImage(initialRender);
            hasInitialGenerated.current[id] = true;
            return;
        }
        
        hasInitialGenerated.current[id] = true;
        runGeneration();

    }, [id, initialImage, initialRender, puterReady]);
    
    useEffect(() => {
        setProject(location.state || null);
        setLoading(location.state ? false : (puterReady ? true : false));
    }, [id, location.state, puterReady]);

    useEffect(() => {
        const fetchProject = async () => {
            if (!puterReady) {
                setLoading(false);
                return;
            }
            if (!id) {
                setLoading(false);
                return;
            }
            
            // If we already have the basic info from state, we might still want to fetch 
            // the full object if it's missing (e.g. on direct visit)
            if (!project?.sourceImage) {
                setLoading(true);
                const data = await getProject(id);
                if (data) {
                    setProject(data);
                }
                setLoading(false);
            }
        };

        fetchProject();
    }, [id, puterReady]);

    if (loading) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (!project) {
        return <div className="p-8 text-center text-red-500">Project not found or failed to load.</div>;
    }

    return (



           <div className="visualizer">
               <nav className="topbar">
                   <div className="brand">
                       <Box className="logo" />
                       <span className="name">
                            Roomify
                        </span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
                       <X className="icon" /> Exit Editor
                   </Button>
               </nav>

               <section className="content">
                   <div className="panel">
                       <div className="panel-header">
                           <div className="panel-meta">
                               <p>Project</p>
                               <h2>{name || 'Untitled Project'}</h2>
                               <p className="note">Created by You</p>
                           </div>
                           <div className="panel-actions">
                               <Button  size="sm" className="export" onClick={()=>{}} disabled={!currentImage}>
                                   <Download className="w-4 h-4 mr-2" />Export
                               </Button>
                               <Button  size="sm" className="share" onClick={()=>{}} disabled={isProcessing}>
                                   <Share2 className="w-4 h-4 mr-2" />Share
                               </Button>

                           </div>
                       </div>
                       <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                           {currentImage ? (
                               <img src={currentImage} alt="AI Render" className="render-img" />
                           ):(
                               <div className="render-placeholder">
                                   {initialImage && (
                                       <img src={initialImage} alt="Original" className="render-fallback" />
                                   )}
                               </div>
                           )}

                           {isProcessing && (
                               <div className="render-overlay">
                                   <div className="rendering-card">
                                       <RefreshCcw className="spinner" />
                                       <span className="title">Rendering...</span>
                                       <span className="subtitle">Generating your 3D visualization</span>

                                   </div>
                               </div>

                           )}

                       </div>

                   </div>
               </section>

           </div>

    );
}

export default VisualizerId;