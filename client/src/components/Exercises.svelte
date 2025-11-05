<script>
    import { onMount } from "svelte";
    import { useUserState } from "../states/userState.svelte.js";
    const userState = useUserState();

    let data = $state([]);
    let { id } = $props();

    onMount( async () => {
        console.log(id);
        const response = await fetch(`/api/languages/${id}/exercises`);
        const jsonData = await response.json();
        console.log(jsonData[0]);
        data = jsonData;
    })
</script>

{#if userState?.email}
    <h1>Available exercises</h1>

    <ul>
        {#each data as exercise}
            <li><a href={`/exercises/${exercise.id}`}>{exercise.title}</a></li>
        {/each}
    </ul>

{:else}
   <p>Login or register to complete exercises.</p>     
{/if}