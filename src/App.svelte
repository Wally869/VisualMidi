<script>
  import "smelte/src/tailwind.css";

  import HeaderContainer from "./Components/HeaderContainer.svelte";
  import Seperator from "./Components/Seperator.svelte";
  import ChannelsControlsContainer from "./Components/ChannelsControlsContainer.svelte";
  import ChartAndChartControlsContainer from "./Components/ChartAndChartControlsContainer.svelte";
</script>

<main class="bg-gray-200">
  <div class="text-gray-500 h-full m-auto">
    <div class="flex items-center justify-center h-screen">
      <div
        class="container bg-white container p-12 border-solid border-2
        rounded-lg max-w-6xl shadow-2xl shadow-inset">
        <HeaderContainer />
        <div class="h-4" />
        <Seperator />
        <div class="h-4" />

        <ChannelsControlsContainer />
        <div class="h-4" />

        <div class="h-auto">
          <ChartAndChartControlsContainer />
        </div>
      </div>
    </div>
  </div>

</main>
