import { supabase } from "@/lib/supabase";


async function login(provider: "google" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    })
    console.log(data, error);

    if(error) {
        console.log("Error signing in:", error.message);
        return;
    }
    console.log("Signed in successfully!");
}

export default function Auth() {
    return (
        <div>
            <button onClick={() => {
                login("google")
            }} >Sign in with Google</button>
            <button onClick={() => {
                login("github")
            }} >Sign in with Github</button>
        </div>
    )
}