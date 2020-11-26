<script>
  import { Switch } from "smelte";

    let bIsPerChannel = false;
    let bExcludeDrums = false;

    let channelID = 0;
</script>

<div class="flex flex-row">
    <div class="flex flex-row justify-around w-full">
      <div class="w-1/2 flex justify-center">
        <Switch label="Per Channel" bind:value={bIsPerChannel}/>
      </div>
      <div class="w-1/2 flex justify-center">
        {#if bIsPerChannel}
            <div>
                <p>Channel {channelID}</p>
            </div>
        {:else}
            <div>
                <Switch label="Exclude Drums" bind:value={bExcludeDrums}/>
            </div>
        {/if}
      </div>
    </div>
</div>
