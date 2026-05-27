import React from 'react';
import {Box} from "lucide-react";
import Button from "~/components/ui/Button";
import {useOutletContext} from "react-router";

const Navbar = () => {

    // @ts-ignore
    const {isSignedIn,userName,signIn,signOut, puterReady} = useOutletContext<AuthContext>()
    const handleAuthClick= async () => {
        console.log("Auth button clicked, isSignedIn:", isSignedIn, "puterReady:", puterReady);
        
        if (!puterReady) {
            console.warn("Puter is not ready yet.");
            return;
        }

        if(isSignedIn){
            try{
                console.log("Attempting sign out...");
                await signOut();
                console.log("Sign out complete");
            }catch(e){
                console.error(`Puter sign out failed: ${e}`);
            }
            return;
        }

        try{
            console.log("Attempting sign in...");
            const success = await signIn();
            console.log("Sign in call finished, success:", success);
        } catch(e){
            console.error(`Puter  sign in failed: ${e}`);
        }

    };
    return (
        <header className="navbar">
            <nav className="inner">
                <div className="left">
                    <div className="brand">
                        <Box className="logo" />
                        <span className="name">
                            Roomify
                        </span>
                    </div>
                    <ul className="links">
                        <a href="#">Product</a>
                        <a href="#">Pricing</a>
                        <a href="#">Community</a>
                        <a href="#">Enterprise</a>
                    </ul>
                </div>
                <div className="actions">
                    {isSignedIn ?(
                        <>
                            <span className="greeting">
                            {userName ? `Hi, ${userName}` : 'Signed in'}
                            </span>
                            <Button size="sm" onClick={handleAuthClick} className="btn">Log Out</Button>
                        </>

                        ) : (
                            <>
                                <Button 
                                    onClick={handleAuthClick} 
                                    size="sm" 
                                    variant="ghost"
                                    disabled={!puterReady}
                                >
                                    {puterReady ? "Log In" : "Loading..."}
                                </Button>
                                <a href="#upload" className="cta">
                                    started
                                </a>
                            </>
                        )}


                </div>
            </nav>

        </header>
    );
};

export default Navbar;