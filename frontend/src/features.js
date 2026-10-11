import './style.css';

 const dataFeature = [
   {
    title: "Your whole store at a glance",
    description: "The SariServe dashboard brings the most important numbers of your store into one clear view. See today’s sales and how they compare with yesterday, the total number of products in your inventory, the items that are running low, and the total utang owed by your customers. Below the summary, weekly sales charts, a breakdown of sales by category, and your most recent transactions help you understand how your store is doing without digging through notebooks or receipts. Whether you check it in the morning or at closing time, you always know where your business stands.",
    buttonDescription: "Try Now!",
    featureImg: "./src/assets/f-1-icon.png"
 },


 {
  title: "Know what’s running low before it runs out",
  description: "Inventory keeps every product in your store organized in one place, along with how much stock is left for each item. When a product is running low, SariServe flags it as needing a restock, so you can reorder in time instead of discovering an empty shelf when a customer asks for it. It also helps you avoid buying too much of what you already have, which keeps your money working for you instead of sitting on the shelf. With a clear view of your stock, restocking becomes a quick decision instead of a guess.",
  buttonDescription: "Learn More",
  featureImg: "./src/assets/f-2-icon.png"
 },

 {
  title: "See what sells best",
  description: "The Sales page turns your daily transactions into simple charts you can read at a glance. View your sales by day, by week, and by product category to see which items move fast and which ones barely sell. With this information, you can stock up on your best sellers, spot slow days early, and plan your purchases with confidence. Instead of relying on memory or a rough guess, you get a clear picture of how your store performs over time.",
  buttonDescription: "See More",
  featureImg: "./src/assets/f-3-icon.png"
 },

 {
  title: "Never lose track of utang again",
  description: "Utang is part of everyday life in a sari-sari store, but a paper notebook can easily get lost, smudged, or forgotten. SariServe keeps a clear record of who owes you, how much they owe, and how many customers currently have a balance. Everything is saved in your account and organized in one list, so you can follow up with the right person at the right time and see your total utang whenever you need it. It helps you stay on good terms with your customers while protecting the money you are owed.",
  buttonDescription: "Connect Us",
  featureImg: "./src/assets/f-4-icon.png"
 }
]


export function initFeature(){
  const featureContainer = document.querySelector('#feature-container');

  if (!featureContainer) return;

  featureContainer.innerHTML = dataFeature.map((item, index) => `
  <div class="mb-20 flex flex-col gap-10 max-w-6xl ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}">
    <div class="flex flex-col gap-6">
      <h2 class="text-3xl lg:text-4xl font-bold text-secondary">${item.title}</h2>
      <p class="text-sm text-secondary/80 md:mr-50">${item.description}</p>

      <button class="mt-3 lg:mt-8 bg-secondary text-base md:text-lg text-primary w-fit px-7 py-2 rounded-2xl hover:cursor-pointer hover:bg-primary transition hover:border border-secondary hover:text-secondary">${item.buttonDescription}</button>
    </div>

    <div class="flex justify-center ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}">
      <img
        class="bg-dark rounded-full p-2 w-74 h-74 lg:w-100 lg:h-100 shrink-0 aspect-square object-contain"
        src="${item.featureImg}"
        alt=""
      >
    </div>
  </div>
`).join('');
} 