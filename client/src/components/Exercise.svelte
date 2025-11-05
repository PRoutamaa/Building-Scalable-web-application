<script>
    import { onMount } from "svelte";
    import Statistics from "./Statistics.svelte";
    import { useUserState } from "../states/userState.svelte";
    const userState = useUserState();

    let exercise = $state({});
    let { id } = $props();

    onMount( async() => {
        const response = await fetch(`/api/exercises/${id}`)
        const jsonData = await response.json();
        console.log(jsonData);
        exercise = jsonData;
        

    })
</script>

<h1>{exercise.title}</h1>
<p>{exercise.description}</p>

{#if userState?.email}
    <Statistics exerciseID={id} />
{:else}
   <p>Login or register to complete exercises.</p>     
{/if}

