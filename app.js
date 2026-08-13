
const frases=[

"«La educación es el arma más poderosa para cambiar el mundo.» <span class='autor'>— Nelson Mandela</span>",

"«Nunca consideres el estudio como una obligación, sino como una oportunidad.» <span class='autor'>— Albert Einstein</span>",

"«La imaginación es más importante que el conocimiento.» <span class='autor'>— Albert Einstein</span>",

"«El éxito es la suma de pequeños esfuerzos repetidos día tras día.» <span class='autor'>— Robert Collier</span>",

"«No importa lo lento que vayas mientras no te detengas.» <span class='autor'>— Confucio</span>",

"«La disciplina es el puente entre las metas y los logros.» <span class='autor'>— Jim Rohn</span>",

"«El aprendizaje nunca agota la mente.» <span class='autor'>— Leonardo da Vinci</span>",

"«Todo parece imposible hasta que se hace.» <span class='autor'>— Nelson Mandela</span>",

"«El conocimiento es poder.» <span class='autor'>— Francis Bacon</span>",

"«La perseverancia convierte el esfuerzo en resultados.» <span class='autor'>— Anónimo</span>",

"«Aprender es descubrir que algo es posible.» <span class='autor'>— Fritz Perls</span>"

];

// Frase del día

const hoy=new Date();
const inicio=new Date(2026,0,1);

const dias=Math.floor((hoy-inicio)/(1000*60*60*24));
const indice=((dias%frases.length)+frases.length)%frases.length;

document.getElementById("fraseHero").innerHTML=frases[indice];