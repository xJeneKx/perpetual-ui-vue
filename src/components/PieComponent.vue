<script setup>
import { computed } from "vue";
import { Pie } from "vue-chartjs";

const props = defineProps(["data"]);

const dataRef = computed(() => {
  const ls = [];
  const ds = [];
  props.data.forEach((v) => {
    ls.push(v.symbol);
    ds.push(v.price);
  });
  return {
    labels: ls,
    datasets: [
      {
        data: ds,
      },
    ],
  };
});

const options = {
  datasets: {
    pie: {
      borderColor: "transparent",
      rotation: 0,
    },
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: function (ctx) {
          const dataPoints = ctx.chart.data.datasets[0].data;
          const total = dataPoints.reduce(
            (total, datapoint) => total + datapoint,
            0
          );
          const value = dataPoints[ctx.dataIndex];
          const percentage = +((value / total) * 100).toFixed(2);
          return `$${ctx.formattedValue} (${percentage}%)`;
        },
      },
    },
    legend: {
      position: "top",
      align: "start",
    },
    datalabels: {
      textAlign: "center",
      display: function (ctx) {
        const dataPoints = ctx.chart.data.datasets[0].data;
        const total = dataPoints.reduce(
          (total, datapoint) => total + datapoint,
          0
        );
        const value = dataPoints[ctx.dataIndex];
        const percentage = (value / total) * 100;
        return percentage > 20;
      },
      formatter: function (value, context) {
        const name = context.chart.data.labels[context.dataIndex];
        return `${name}\n$${value}`;
      },
    },
  },
};
</script>

<template>
  <Pie
    class="w-full"
    v-if="Object.keys(props.data).length"
    :data="dataRef"
    :options="options"
  />
</template>

<style scoped></style>
