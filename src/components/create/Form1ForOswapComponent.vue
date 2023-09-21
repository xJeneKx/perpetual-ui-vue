<script setup>
import { onUnmounted, ref, watch } from "vue";
import LoadingIcon from "@/components/icons/LoadingIcon.vue";
import {
  getAssetMetadataByArray,
  getDataFeed,
  getDefinition,
} from "@/services/DAGApi";
import AutocompleteComponent from "@/components/AutocompleteComponent.vue";
import TextInput from "@/components/inputs/TextInput.vue";
import feedNamesByOracle from "@/feedNamesByOracle";
import { isValidAddress } from "@/utils/validates";
import emitter from "@/services/emitter";
import { ADDRESSES } from "@/config";
import { getAddressByDefinition } from "@/utils/addressUtils";
import { followLink, generateDefinitionLink } from "@/utils/generateLink";
import BackButtonComponent from "@/components/BackButtonComponent.vue";

const props = defineProps(["reserveAsset", "reserveAssetSymbol", "metadata"]);
const emit = defineEmits(["setReservePriceAa", "goBack"]);

const metadataByAsset = ref({});
const isLoaded = ref(false);
const xDecimals = ref(0);
const yDecimals = ref(0);
const xOracleAddress = ref("F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N");
const yOracleAddress = ref("F4KHJUCLJKY4JV7M5F754LAJX4EB7M4N");
const xDataFeed = ref("");
const yDataFeed = ref("");
const xAddressIsValid = ref(false);
const yAddressIsValid = ref(false);
const xErrorMessage = ref("");
const yErrorMessage = ref("");

const watchAA = ref("");
const awaiting = ref(false);

function handleDefinition(payload) {
  if (payload.address === watchAA.value) {
    awaiting.value = true;
  }
}

function handleDefinitionSaved(payload) {
  if (payload.address === watchAA.value) {
    emit("setReservePriceAa", watchAA.value);
  }
}

emitter.on(`aa_definition_${ADDRESSES.reserve_price_oswap}`, handleDefinition);
emitter.on(
  `aa_definition_saved_${ADDRESSES.reserve_price_oswap}`,
  handleDefinitionSaved
);

async function openWallet() {
  const data = {
    oswap_aa: props.metadata.address,
    x_oracle: xOracleAddress.value,
    y_oracle: yOracleAddress.value,
    x_feed_name: xDataFeed.value,
    y_feed_name: yDataFeed.value,
    x_decimals: xDecimals.value,
    y_decimals: yDecimals.value,
  };

  const definition = [
    "autonomous agent",
    {
      base_aa: ADDRESSES.reserve_price_oswap,
      params: data,
    },
  ];

  const address = getAddressByDefinition(definition);
  const def = await getDefinition(address);
  if (def.definition) {
    emit("setReservePriceAa", address);
    return;
  }

  watchAA.value = getAddressByDefinition(definition);
  const link = generateDefinitionLink(definition);
  followLink(link);
}

async function getFeedNameListX() {
  if (!xAddressIsValid.value) return [];
  return feedNamesByOracle[xOracleAddress.value] || [];
}
async function getFeedNameListY() {
  if (!yAddressIsValid.value) return [];
  return feedNamesByOracle[yOracleAddress.value] || [];
}

watch(
  () => props.reserveAsset,
  async () => {
    isLoaded.value = false;

    const { x_asset, y_asset } = props.metadata;
    const md = await getAssetMetadataByArray([x_asset, y_asset]);
    metadataByAsset.value = md;

    if (md[x_asset]) xDecimals.value = md[x_asset].decimals;
    if (md[y_asset]) yDecimals.value = md[y_asset].decimals;

    isLoaded.value = true;
  },
  {
    immediate: true,
  }
);

async function checkOracleData() {
  let result = await getDataFeed(xOracleAddress.value, xDataFeed.value);
  if (!result) {
    xErrorMessage.value = "Data feed not found";
    return;
  }

  result = await getDataFeed(yOracleAddress.value, yDataFeed.value);
  if (!result) {
    yErrorMessage.value = "Data feed not found";
    return;
  }

  openWallet();
}

watch(
  xOracleAddress,
  () => {
    xAddressIsValid.value = isValidAddress(xOracleAddress.value);
  },
  {
    immediate: true,
  }
);

watch(
  yOracleAddress,
  () => {
    yAddressIsValid.value = isValidAddress(yOracleAddress.value);
  },
  {
    immediate: true,
  }
);

watch([xOracleAddress, xDataFeed], () => {
  xErrorMessage.value = "";
});

watch([yOracleAddress, yDataFeed], () => {
  yErrorMessage.value = "";
});

function goBack() {
  emit("goBack");
}

onUnmounted(() => {
  emitter.off(
    `aa_definition_${ADDRESSES.reserve_price_oswap}`,
    handleDefinition
  );
  emitter.off(
    `aa_definition_saved_${ADDRESSES.reserve_price_oswap}`,
    handleDefinitionSaved
  );
});
</script>

<template>
  <Teleport to="#back_button"><BackButtonComponent @click="goBack" /></Teleport>
  <div v-if="!isLoaded">
    <div class="text-center">Loading...<LoadingIcon /></div>
  </div>
  <div v-else-if="awaiting">
    <div>
      The payment is detected, as soon as it is confirmed, you will proceed to
      the next step<LoadingIcon />
    </div>
  </div>
  <div v-else>
    <div>Reserve asset: {{ reserveAssetSymbol }}</div>
    <div class="divider"></div>
    <div>
      <div class="mb-2">
        Asset: {{ metadataByAsset[metadata.x_asset].name }}
      </div>
      <TextInput v-model="xOracleAddress" placeholder="Oracle address" />
      <AutocompleteComponent
        :get-src-for-auto-complete="getFeedNameListX"
        v-model="xDataFeed"
        placeholder="Feed name"
        class="mt-4"
      />
      <div v-if="xErrorMessage" class="mt-2 mb-2 text-red-500">
        {{ xErrorMessage }}
      </div>
    </div>
    <div class="divider"></div>
    <div>
      <div class="mb-2">
        Asset: {{ metadataByAsset[metadata.y_asset].name }}
      </div>
      <TextInput v-model="yOracleAddress" placeholder="Oracle address" />
      <AutocompleteComponent
        :get-src-for-auto-complete="getFeedNameListY"
        v-model="yDataFeed"
        placeholder="Feed name"
        class="mt-4"
      />
      <div v-if="yErrorMessage" class="mt-2 mb-2 text-red-500">
        {{ yErrorMessage }}
      </div>
    </div>
    <div class="text-center">
      <button
        class="btn btn-primary mt-4"
        :class="{
          '!btn-disabled':
            !xOracleAddress || !yOracleAddress || !xDataFeed || !yDataFeed,
        }"
        @click="checkOracleData"
      >
        Create reserve price aa
      </button>
    </div>
  </div>
</template>

<style scoped></style>