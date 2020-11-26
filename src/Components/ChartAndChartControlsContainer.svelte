<script>
  import RadioButton from "./RadioButton.svelte";
  import { Button } from "smelte";


	import { csv } from 'd3-fetch';

  import ScatterPlot from '../ScatterPlot.svelte';
	let scatterPlotData;
	csv('world_bank.csv').then(data => scatterPlotData = data);

    let buttonsNames = ["Overview", "aaa", "bbb", "ccc"];

    let buttonElems = [
        {id: 0, selected: true, label: "Raw Overview"},
        {id: 1, selected: false, label: "aaa"},
        {id: 2, selected: false, label: "bbb"},
        {id: 3, selected: false, label: "ccc"}

    ]

  let trackerSelected = [true, false, false, false];
  function selectChannel(id) {
      console.log("selecting channel");
      trackerSelected = [false, false, false, false];
      trackerSelected[id] = true;

      updateColors();
  }

  let colors = ["primary", "secondary", "secondary", "secondary"];
  $: colors = colors.filter(el => el);
  function updateColors() {
      for (var i = 0; i < trackerSelected.length; i++) {
          colors[i] = (trackerSelected[i]) ? "primary" : "secondary";
      }
      console.log(colors)
  }

  function getColorElement(id) {
      if (trackerSelected[id]) {
          return "primary";
      } else {
          return "secondary";
      }
  }
  
  function doTheUpdate(id) {
      console.log("update this shit")
      console.log(id)
      for (var i = 0; i < buttonElems.length; i++) {
          if (i == id) {
              buttonElems[i].selected = true;
          } else {
              buttonElems[i].selected = false;
          }
      }
  }

    function getColorFromStatus(elBoolean) {
        if (elBoolean) {
            return "primary"
        } else {
            return "secondary"
        }
    }

  $: cmps = buttonElems.filter(el => el);
</script>

<div class="flex flex-row items-center">
  <div class="w-1/5">
    <!--<RadioButton label="Overview" />-->
    <div class="flex flex-col space-y-8 ">
    <!--
      <Button class="w-full" bind:color={colors[0]} on:click={() => selectChannel(0)}>Raw Overview</Button>
      <Button class="w-full" bind:color={colors[1]} on:click={() => selectChannel(1)}>Delta Times</Button>
      <Button class="w-full" bind:color={colors[2]} on:click={() => selectChannel(2)}>Intervals Overview</Button>
      <Button class="w-full" bind:color={colors[3]} on:click={() => selectChannel(3)}>Intervals Succession</Button>
      -->
      {#each buttonElems as bn}
        {getColorFromStatus(bn.selected)}
        <Button class="w-full" color={getColorFromStatus(bn.selected)} on:click={() => doTheUpdate(bn.id)}>{bn.label} - {bn.selected}</Button>
      {/each}
    </div>
  </div>
  <div class="w-4/5">
    {#if scatterPlotData}
    		<div class='chart'>
			<h3>Espérance de vie en fonction du PIB par habitant (2018)</h3>
			<ScatterPlot data={scatterPlotData} />
			<p>Source&nbsp;: Banque Mondiale</p>
		</div>
        {/if}
  </div>
</div>


<style>
	h1 {
		font: 2.5rem 'Alata', sans-serif;
		text-align: center;
		margin: 1rem 0;
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 48rem;
		margin: 0 auto;
	}

	.chart {
		width: 100%;
		position: relative;
		margin-bottom: 1rem;
	}

	.chart h3 {
		position: absolute;
		width: 100%;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		margin: 0;
		font-size: 1.1rem;
		text-align: center;
		z-index: 42;
	}

	.chart p {
		position: absolute;
		width: 100%;
		bottom: 0;
		right: 0;
		margin: 0;
		font-size: 0.9rem;
		font-style: italic;
		text-align: right;
		z-index: 42;
	}
</style>
