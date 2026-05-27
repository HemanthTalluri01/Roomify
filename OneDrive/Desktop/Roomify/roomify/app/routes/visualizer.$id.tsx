import React, {useEffect, useState} from 'react';
import {useLocation, useParams, useOutletContext} from "react-router";
import {getProject} from "../../lib/puter.action";

const VisualizerId  =() =>{
    const { id } = useParams();
    const location = useLocation();
    const {puterReady} = useOutletContext<AuthContext>();
    
    const [project, setProject] = useState<DesignItem | null>(location.state || null);
    const [loading, setLoading] = useState(!location.state);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id || !puterReady) return;
            
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
    }, [id, puterReady, project?.sourceImage]);

    if (loading) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (!project) {
        return <div className="p-8 text-center text-red-500">Project not found or failed to load.</div>;
    }

    return (
       <section>
           <h1>{project.name || 'Untitled Project'}</h1>

           <div className="visualizer">
               {project.sourceImage && (
                   <div className="image-container">
                   <h2>Source Image</h2>
                       <img src={project.sourceImage} alt="source"/>
                   </div>
               )}
               {project.renderedImage && (
                   <div className="image-container">
                   <h2>Rendered Image</h2>
                       <img src={project.renderedImage} alt="rendered"/>
                   </div>
               )}
           </div>
       </section>
    );
}

export default VisualizerId;