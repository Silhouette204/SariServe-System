import './style.css'

//dito lahat ilalagay yung data yung mga questions and answers in array format
const accordionData = [
  {
    question: "Ano ang SariServe at para saan ito?",
    answer: "Ang SariServe ay isang digital monitoring system na ginawa para sa mga maliliit na negosyo gaya ng sari-sari stores at tech shops. Tinutulungan nito ang mga tindero at tindera na palitan ang tradisyunal na paglilista sa notebook sa pamamagitan ng pagbibigay ng digital inventory grid at digital na listahan ng utang.",
    iconClass: "fa-plus"
  },
  {
    question: "Mawawala ba ang mga inilista ko kapag pinatay ko ang cellphone o computer ko?",
    answer: "Hindi po. Ang lahat ng inilalagay mong produkto, presyo, at utang ay awtomatikong nase-save sa system ng mismong gamit mong device. Kahit i-refresh mo ang page, isara ang browser, o i-restart ang cellphone mo, nandoon pa rin ang mga listahan mo pagbukas mo.Paalala lang po: Huwag muna pong mag-clear ng browser history/cache para hindi mabura ang mga nakaimbak na data."
  },
  {
    question: "Paano ko malalaman kung anong mga paninda ang paubos na?",
    answer: "Hindi mo na kailangang isa-isahin ang mga estante mo! Sa iyong Dashboard, may makikita kang kahon na may nakasulat na. Low Stock Items. Kapag ang stock ng isang produkto ay bumaba sa 5 piraso pababa, awtomatiko itong magpapakita doon at magkukulay dilaw para mabilis mong malaman kung ano ang dapat mong ipamili ulit."
  },
  {
    question: "Paano po magbawas ng stock kapag may bumili sa tindahan?",
    answer: "Pumunta lang sa Inventory Grid page. Hanapin ang produkto na binili (halimbawa: Lucky Me Supreme), at i-click ang minus (-) button para mabawasan ang stock nito. Kung may bagong dating na paninda, plus (+) button naman ang pipindutin mo para magdagdag."
  },
  {
    question: "Paano ko naman po ililista ang mga kapitbahay na umutang muna?",
    answer: "Pumunta sa Debt Listing page at i-click ang Add New Debt (Magdagdag ng Utang). Ilagay ang pangalan ng suki, magkano ang kinuha niya, at ang petsa. Awtomatiko itong papasok sa listahan mo at magpapakita sa Dashboard mo sa ilalim ng Active Debts (Utang) para lagi mong natatandaan kung magkano pa ang kabuuang sisingilin mo."
  },
  {
    question: "Paano ko tatandian na nagbayad na ang may utang?",
    answer: "Sa iyong Debt Listing, hanapin mo lang ang pangalan ng nagbayad na suki. May makikita kang status button na nakasulat ay Unpaid. I-click mo lang 'yan, at awtomatiko itong magiging berde at magiging Paid na. Mababawasan din agad ang kabuuang utang na nakalista sa dashboard mo."
  },
  {
    question: "Kailangan ko ba ng load o internet para magamit ang SariServe?",
    answer: "Hindi po kailangan! Ang SariServe ay offline-friendly sa kasalukuyan. Ibig sabihin, kahit wala kang Wi-Fi o mobile data, pwedeng-pwede mong buksan at gamitin ang app para mag-update ng benta, magbawas ng stock, o maglista ng utang habang nagbabantay ka sa tindahan."
  },

];

//kuukunin natin yung div sa accordion at dito na tayo maglalagay ng layout like items buttons and icon para isahan nalang para di na iredeclare sa html ng paulit ulit
const accordionContainer = document.querySelector('#accordion-container');

//dito na natin ipapasok yung html template para isahang call nalang pag mag aadd ka ng panibagong question and answer
export function renderFAQ(){
  //dito icacall out natin yung question since tanong muna bago sagot
  //yung item at index ay isang parameter kung ano ang dapat nilalaman sa loob ng container na ito item ito yung value nya and index parang for loops mag iincrement nalang pag may i-add na panigabong info
   accordionContainer.innerHTML = accordionData.map((item, index) => `
        <div class="accordion-items border-b border-gray-300">
      <button class="accordion-question w-full flex justify-between items-center py-5 cursor-pointer">
        <span class="text-start text-lg font-medium text-dark">${item.question}</span>
      <i class="dropdown fa-solid fa-chevron-down transition-transform duration-300"></i>
    </button>

       <div class="accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
       <div class="pb-5 text-dark/70">
         <h3>${item.answer}</h3>
         </div>
       </div>
      </div>
   `).join('');
   // .join('') para mawala ang mga comma sa display
}

renderFAQ();// para lumabas sa screen yung html layout nato
insertAccordionFunction();

//yung addEventListener function dito
export function insertAccordionFunction(){
   const question = document.querySelectorAll('.accordion-question');

   //forEach logic na para pwede paulit ulit pindutin
   question.forEach(header => {
    header.addEventListener('click', () => {
      const answer = header.nextElementSibling;
      const icon = header.querySelector('.dropdown');

      //logic function kung paano mag close and open

      //manual closing (kailangan pindutin)
      if(answer.style.maxHeight){
        answer.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
      } else {
        // Self-closing logic (pag may pinindot kang ibang questions)
        question.forEach (i => {
         i.nextElementSibling.style.maxHeight = null;
         i.querySelector('.dropdown').style.transform = 'rotate(0deg)';
        });
         
        //pagbubukas na sya
         answer.style.maxHeight = answer.scrollHeight + "px";
         icon.style.transform = 'rotate(180deg)'; 
      }
    
    });
   });

     // Makikinig tayo sa buong document kaya kapag pumindot ka sa iba mag close nalang ito ng kusa
   window.addEventListener('click', (e) => {
  // 1. Tignan natin kung ang kinlick ni user ay nasa loob ng isang accordion button
  // Ang .closest() ay parang naghahanap "pataas" kung nasa loob ba siya ng class na yan
  const isClickInside = e.target.closest('.accordion-question');

  // 2. Kung ang kinlick ay HINDI button (.accordion-question)
  if (!isClickInside) {
    // Isara nating lahat!
    question.forEach(header => {
      const content = header.nextElementSibling;
      const icon = header.querySelector('.dropdown');
      
      content.style.maxHeight = null;
      icon.style.transform = 'rotate(0deg)';
    });
  }
});

}

