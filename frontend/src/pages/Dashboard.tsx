
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"




export default function Dashboard() {

    useEffect(() => {
        async function fetchSession() {
            const { data, error } = await supabase.auth.getClaims()
            if (error) {
                console.error("Error fetching session:", error)
                return
            }
            console.log("Session:", data)
        }
        fetchSession()
    }, [])
    return (
        <div>Dashboard</div>
    )
}