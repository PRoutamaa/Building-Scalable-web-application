<script>
    import { onMount } from "svelte";
    import { useUserState } from "../states/userState.svelte.js";
    const userState = useUserState();

    let languages = [];
    
    onMount(async () => {
        console.log("fetching data")
        const response = await fetch(`/api/languages`);
        const data = await response.json();
        console.log(data);
        languages = data
        console.log(languages[0]);
    });
</script>

<ul>
{#each languages as language}
    <li><a href={`/languages/${language.id}`}>{language.name}</a></li>
{/each}
</ul>   
