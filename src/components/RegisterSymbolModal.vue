<script setup>
import { onMounted, ref, watch } from "vue";
import { DialogPanel } from "@headlessui/vue";
import { generateLink } from "@/utils/generateLink";
import { useAaInfoStore } from "@/stores/aaInfo";
import { storeToRefs } from "pinia";
import { event } from "vue-gtag";
import debounce from "lodash.debounce";
import TextInput from "@/components/inputs/TextInput.vue";
import NumberInput from "@/components/inputs/NumberInput.vue";
import { getAssetBySymbol, getDefinition } from "@/services/DAGApi";
import { getMetadataForSymbolByDataFeed } from "@/services/SymbolAPI";

const store = useAaInfoStore();

const { meta } = storeToRefs(store);

const props = defineProps(["asset", "perpAa", "multiplier"]);

const registryAA = ref("");

const symbol = ref("");
const symbolFieldError = ref("");
const decimals = ref("");
const buttonEnabled = ref(false);
const link = ref("");
const tracked = ref("");

function regSymbolEvent() {
  event("register_symbol", {
    event_label: `${props.asset} - ${symbol.value} - ${decimals.value}`,
  });
}

watch(
  [symbol, decimals],
  debounce(async () => {
    symbolFieldError.value = "";
    buttonEnabled.value = false;

    if (!symbol.value) {
      return;
    }

    const isSymbolTaken = await getAssetBySymbol(
      registryAA.value,
      symbol.value
    );

    if (isSymbolTaken) {
      symbolFieldError.value =
        "Symbol is already taken, please use another one";
      return;
    }

    if (decimals.value === "") {
      return;
    }

    link.value = generateLink(
      100000000,
      {
        asset: props.asset,
        symbol: symbol.value,
        decimals: decimals.value,
        description: `Asset in perpetual futures set ${props.perpAa}, tracking ${tracked.value}`,
      },
      null,
      import.meta.env.VITE_REGISTRY_AA,
      "base",
      true
    );

    buttonEnabled.value = true;
  }, 500),
  { immediate: true }
);

const suggestValueForSymbolField = async (feedName) => {
  const reserveAssetSymbol = feedName.split("_")[0];

  let index = 1;
  let newSymbolSuggestion = `${reserveAssetSymbol}${index}`;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const asset = await getAssetBySymbol(newSymbolSuggestion);

    if (!asset) break;

    newSymbolSuggestion = `${reserveAssetSymbol}${++index}`;
  }

  symbol.value = newSymbolSuggestion;
};

async function setDecimalsAndName(feedName) {
  const metadata = await getMetadataForSymbolByDataFeed(feedName);
  if (!metadata) {
    let d = props.multiplier.split(".");
    d = d[1] ? d[1].length : 9;
    const name = feedName.split("_")[0];

    decimals.value = String(d);
    tracked.value = name;
    return;
  }

  decimals.value = String(metadata.decimals);
  tracked.value = metadata.name;
}

onMounted(async () => {
  const priceAA = meta.value[props.perpAa][`asset_${props.asset}`].price_aa;

  const result = await getDefinition(priceAA);

  const feedName = result.definition[1].params.feed_name;
  await Promise.all([
    suggestValueForSymbolField(feedName),
    setDecimalsAndName(feedName),
  ]);
});
</script>

<template>
  <DialogPanel class="w-full max-w-xl rounded-2xl bg-base-200 p-8">
    <div class="text-center text-2xl font-bold">
      Register a symbol for asset
    </div>
    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">Asset</span>
      </label>
      <TextInput :static-value="asset" />
    </div>
    <div class="form-control mt-2">
      <label class="label">
        <span class="label-text">Symbol</span>
      </label>
      <TextInput
        v-model="symbol"
        @input="() => (symbol = symbol.toUpperCase())"
      />
      <span
        v-if="symbolFieldError"
        class="flex tracking-wide text-red-500 text-xs mt-2 ml-2"
      >
        {{ symbolFieldError }}
      </span>
    </div>
    <div class="form-control mt-2">
      <label class="label">
        <span class="label-text">Decimals</span>
      </label>
      <NumberInput v-model="decimals" />
    </div>
    <div class="form-control mt-6">
      <a
        class="btn btn-primary btn-sm"
        :href="link"
        @click="regSymbolEvent"
        :class="{ '!btn-disabled': !buttonEnabled }"
        >Register symbol</a
      >
    </div>
  </DialogPanel>
</template>

<style scoped></style>
