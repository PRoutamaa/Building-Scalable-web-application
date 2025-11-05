<script>
    let { exerciseID } = $props();
    let text = $state("");
    let count = $state(0);
    let noIfs = $state([]);
    let id = $state('');
    let grade = $state();
    let gradingStatus = $state();
    let poll = $state(false);
    let prediction = $state("")
    let timer;

    const pollingStatus = async () => {
        if (poll) {
            const response = await fetch(`/api/submissions/${id}/status`);
            const jsonData = await response.json();
            console.log(jsonData);
            gradingStatus = jsonData.grading_status;
            if (jsonData.grading_status === "graded") {
                poll = false;
                grade = jsonData.grade;
            }
        }
        

    }

    const addText = async () => {
        console.log(exerciseID)
        count = text.length;
        noIfs = (text.match(/if/g) || []);
        const response = await fetch(`/api/exercises/${exerciseID}/submissions`, {
            method: "POST",
            body: JSON.stringify({ source_code: text }),
        });
        const jsonData = await response.json();
        console.log(jsonData)
        id = jsonData.id;
        text = "";
        poll = true;
    }
    if (!import.meta.env.SSR) {
        setInterval(pollingStatus, 500);
  }

    const getEstimate = async () => {
        const exercise = exerciseID;
        const code = text;
        const response = await fetch("/inference-api/predict", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({
                exercise,
                code
            })
        });
        const data = await response.json()
        prediction = `Correctness estimate: ${Math.round(data.prediction)}%`;
    }

    const counter = () => {
        prediction = "";
        clearTimeout(timer);
        timer = setTimeout(() => getEstimate(), 500);
    };

</script>

<p>Grading status: {gradingStatus}</p>
<p>Grade: {grade}</p>

{#if count > 0}
<p>Characters: {count}</p>
<p>ifs: {noIfs.length}</p>
{/if}
{#if prediction.length > 0}
<p>{prediction}</p>
{/if}

<textarea bind:value={text} oninput={counter} placeholder="Enter text"></textarea><br />
<button onclick={addText}>Submit</button>