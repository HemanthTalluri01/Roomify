import React, {useState, useRef, useEffect} from 'react';
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../../lib/constants";

interface UploadProps {
    onComplete: (base64: string) => void;
}

const Upload = ({ onComplete }: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const[progress,setProgress] = useState(0);
    const{ isSignedIn } = useOutletContext<AuthContext>();

    const readerRef = useRef<FileReader | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (readerRef.current) {
                readerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const processFile = (file: File) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (readerRef.current) readerRef.current.abort();

        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        readerRef.current = reader;

        reader.onloadend = () => {
            if (!mountedRef.current) return;
            const base64 = reader.result as string;
            
            const interval = setInterval(() => {
                if (!mountedRef.current) {
                    clearInterval(interval);
                    return;
                }
                setProgress((prev) => {
                    const next = prev + PROGRESS_STEP;
                    if (next >= 100) {
                        clearInterval(interval);
                        intervalRef.current = null;
                        
                        const timeout = setTimeout(() => {
                            if (mountedRef.current) {
                                onComplete(base64);
                            }
                        }, REDIRECT_DELAY_MS);
                        timeoutRef.current = timeout;
                        
                        return 100;
                    }
                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
            intervalRef.current = interval;
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isSignedIn) return;
        
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy";
        }
        
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!isSignedIn) return;
        
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    return (
        <div className="upload">
            {!file ?(
                <div 
                    className={`dropzone ${isDragging ? `is-dragging` : ''}`}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={handleFileChange}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    />
                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />

                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop"
                            ) :(
                                "Sign in or sign up with Puter to upload"
                            )}
                        </p>
                        <p className="help">Maximum file size 50MB.</p>

                    </div>
                </div>

            ) :(
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ):(
                                <ImageIcon className="image" />
                            )}

                        </div>
                        <h3>{file.name}</h3>
                        <div className="progress">
                            <div className="bar" style={{width: `${progress}%`}} />

                            <p className="status-text">
                                {progress<100 ? 'Analysing Floor Plan...' : 'Redirecting...'}

                            </p>



                        </div>

                    </div>
                </div>

            )}

        </div>
    );
}

export default Upload;