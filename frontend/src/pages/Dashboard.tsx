
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router";




export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState< User | null>(null);

    useEffect(() => {
        async function fetchUser() {
            const { data, error } = await supabase.auth.getUser()
            if (error) {
                console.error("Error fetching user data:", error)
                return
            }
            setUser(data.user);
            console.log("Get user: ", data)
        }
        fetchUser()
    }, [])
    return (
        <div>
            {!user ? (
                <button onClick={() => {
                    navigate("/auth")
                }}> Go to SIGIN</button>
            ) : (
                user && <div>
                    user email : {user?.email}
                    <button onClick={() => {
                        supabase.auth.signOut();
                        setUser(null);
                        navigate("/")
                    }} >LOGOUT</button>
                    </div> 
               
            )}
        </div>
    )
}