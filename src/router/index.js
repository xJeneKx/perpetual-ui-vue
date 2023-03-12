import { createRouter, createWebHistory } from "vue-router";
import BuyView from "../views/BuyView.vue";
import MarketView from "../views/MarketView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/market",
      name: "market",
      component: MarketView,
    },
    {
      path: "/buy/:aa(.*)?",
      name: "buy",
      component: BuyView,
    },
    {
      path: "/sell/:aa(.*)?",
      name: "sell",
      component: () => import("../views/SellView.vue"),
    },
    {
      path: "/stake/:aa(.*)?",
      name: "stake",
      component: () => import("../views/StakeView.vue"),
    },
    {
      path: "/vote/:aa(.*)?",
      name: "vote",
      component: () => import("../views/VoteView.vue"),
    },
    {
      path: "/presale/:aa(.*)?",
      name: "presale",
      component: () => import("../views/PresaleView.vue"),
    },
    {
      path: "/create/:aa",
      name: "createSymbols",
      component: () => import("../views/CreateSymbols.vue"),
    },
    {
      path: "/create",
      name: "create",
      component: () => import("../views/CreateView.vue"),
    },
  ],
});

export default router;
