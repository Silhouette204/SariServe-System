import './style.css'

//dito lahat ilalagay yung data yung mga questions and answers in array format
const accordionData = [
  {
    question: "Ano ang Recruitment Team?",
    answer: "Kami ay grupo na tumutulong sa mga aplikante na makahanap ng trabaho.",
    iconClass: "fa-plus"
  },
  {
    question: "Magkano ba ang dito pag nag apply?",
    answer: "Kami ay buong tumatanggap ng libre para sa mga aplikante na gusto mag trabaho."
  }
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
        <span class="text-lg font-medium text-dark">${item.question}</span>
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

