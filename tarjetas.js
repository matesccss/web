/* =========================================================
   TARJETAS DE REPASO
   ---------------------------------------------------------
   Una lista por tema: ["pregunta", "respuesta"].
   Para añadir, quitar o corregir tarjetas basta con editar
   este archivo. La clave es la ruta de la página del tema.
========================================================= */

window.TARJETAS = {

    "ccss2/tema1": [
        ["¿Cuándo se pueden multiplicar dos matrices A·B?", "Cuando el nº de columnas de A coincide con el nº de filas de B. Si A es m×n y B es n×p, A·B es m×p."],
        ["¿Es conmutativo el producto de matrices?", "No. En general A·B ≠ B·A."],
        ["¿A qué es igual (A·B)ᵗ?", "Bᵗ·Aᵗ (se invierte el orden)."],
        ["¿Cómo se calcula el determinante de una matriz 2×2 (a b / c d)?", "a·d − b·c"],
        ["¿Qué regla se usa para calcular un determinante 3×3?", "La regla de Sarrus (o desarrollar por una fila o columna)."],
        ["¿Cuándo tiene inversa una matriz A?", "Cuando es cuadrada y |A| ≠ 0."],
        ["Fórmula de la matriz inversa", "A⁻¹ = (1 / |A|) · (Adj A)ᵗ"],
        ["¿A qué es igual |A·B|?", "|A|·|B|"],
        ["Si A es de orden n, ¿cuánto vale |k·A|?", "kⁿ·|A| (cada fila se multiplica por k)."],
        ["Si una matriz tiene dos filas iguales o proporcionales, su determinante…", "…vale 0."],
        ["¿Qué es el rango de una matriz?", "El nº máximo de filas (o columnas) linealmente independientes: el orden del mayor menor no nulo."],
        ["¿Cómo se despeja X en A·X = B? ¿Y en X·A = B?", "A·X = B → X = A⁻¹·B.  X·A = B → X = B·A⁻¹. ¡El orden importa!"]
    ],

    "ccss2/tema2": [
        ["¿Qué dice el teorema de Rouché-Frobenius?", "Un sistema es compatible si y solo si rg(A) = rg(A*)."],
        ["¿Cuándo es un sistema compatible determinado?", "Cuando rg(A) = rg(A*) = nº de incógnitas: solución única."],
        ["¿Cuándo es un sistema compatible indeterminado?", "Cuando rg(A) = rg(A*) < nº de incógnitas: infinitas soluciones."],
        ["¿Cuándo es un sistema incompatible?", "Cuando rg(A) ≠ rg(A*): no tiene solución."],
        ["¿Qué es un sistema homogéneo? ¿Puede ser incompatible?", "Todos los términos independientes son 0. Nunca es incompatible: siempre tiene al menos la solución (0, 0, 0)."],
        ["¿Cuándo se puede aplicar la regla de Cramer?", "En cualquier sistema compatible. Si es SCD (|A| ≠ 0), directamente. Si es SCI, se toma un menor no nulo de orden rg(A), las incógnitas que sobran pasan al otro miembro como parámetros y se aplica Cramer a ese sistema."],
        ["Regla de Cramer: ¿cómo se calcula x?", "x = |Aₓ| / |A|, donde Aₓ es A cambiando la columna de x por los términos independientes."],
        ["¿En qué consiste el método de Gauss?", "En transformar el sistema en uno escalonado mediante operaciones entre filas."],
        ["Programación lineal: ¿qué es la región factible?", "El conjunto de puntos que cumplen todas las restricciones."],
        ["¿Dónde se alcanza el óptimo de la función objetivo?", "En un vértice de la región factible. Si dos vértices dan el mismo valor, en todo el segmento que los une."],
        ["¿Cómo se representa la inecuación a·x + b·y ≤ c?", "Se dibuja la recta a·x + b·y = c y se prueba un punto, por ejemplo (0, 0), para elegir el semiplano."],
        ["¿Qué hay que comprobar si la región factible no está acotada?", "Que el óptimo exista: puede que la función crezca (o decrezca) sin límite y no haya máximo (o mínimo)."]
    ],

    "ccss2/tema3": [
        ["Regla de Laplace", "P(A) = casos favorables / casos posibles (si todos los sucesos elementales son equiprobables)."],
        ["¿Cuánto vale P(A ∪ B)?", "P(A) + P(B) − P(A ∩ B)"],
        ["¿Cuánto vale la probabilidad del contrario?", "P(Ā) = 1 − P(A)"],
        ["¿Qué son dos sucesos incompatibles?", "Los que no pueden ocurrir a la vez: A ∩ B = ∅ y P(A ∩ B) = 0."],
        ["Fórmula de la probabilidad condicionada P(A | B)", "P(A | B) = P(A ∩ B) / P(B)"],
        ["¿Cuándo son independientes A y B?", "Cuando P(A ∩ B) = P(A)·P(B) (equivale a P(A | B) = P(A))."],
        ["¿Incompatibles e independientes es lo mismo?", "No. Si A y B son incompatibles y ambos tienen probabilidad positiva, NO son independientes."],
        ["Leyes de De Morgan: P(Ā ∩ B̄) = ?", "P(Ā ∩ B̄) = 1 − P(A ∪ B)"],
        ["Teorema de la probabilidad total", "P(B) = P(A₁)·P(B | A₁) + … + P(Aₙ)·P(B | Aₙ), con A₁…Aₙ un sistema completo de sucesos."],
        ["Teorema de Bayes", "P(Aᵢ | B) = P(Aᵢ)·P(B | Aᵢ) / P(B)"],
        ["¿Qué es un sistema completo de sucesos?", "Sucesos incompatibles dos a dos cuya unión es todo el espacio muestral."],
        ["¿Cuánto vale P(A − B) (que ocurra A pero no B)?", "P(A) − P(A ∩ B)"]
    ],

    "ccss2/tema4": [
        ["¿Qué distribución sigue la media muestral X̄?", "N(μ, σ/√n), si la población es normal o si n ≥ 30."],
        ["Intervalo de confianza para la media μ", "(x̄ − z·σ/√n , x̄ + z·σ/√n), con z = z_α/2."],
        ["Fórmula del error máximo admisible", "E = z_α/2 · σ/√n"],
        ["¿Cómo se calcula el tamaño mínimo de la muestra?", "n ≥ (z_α/2 · σ / E)². Se redondea siempre hacia arriba."],
        ["Valores críticos z_α/2 para 90 %, 95 % y 99 %", "1,645 · 1,96 · 2,575"],
        ["Si aumenta el nivel de confianza (con el mismo n), el intervalo…", "…se hace más ancho: aumenta el error."],
        ["Si aumenta el tamaño de la muestra, el error…", "…disminuye y el intervalo se estrecha."],
        ["¿Cuánto hay que aumentar n para reducir el error a la mitad?", "Hay que multiplicarlo por 4."],
        ["¿Qué distribución sigue la proporción muestral p̂?", "N(p, √(p·(1 − p)/n)), para n grande."],
        ["Intervalo de confianza para una proporción", "p̂ ± z_α/2 · √(p̂·(1 − p̂)/n)"],
        ["¿Cómo se tipifica una variable X ~ N(μ, σ)?", "Z = (X − μ) / σ, que sigue una N(0, 1)."],
        ["¿Qué es el muestreo estratificado proporcional?", "Cada estrato aporta a la muestra en la misma proporción que tiene en la población."]
    ],

    "ccss2/tema5": [
        ["¿Cuándo es f continua en x = a?", "Cuando existe f(a), existe el límite cuando x → a y ambos coinciden."],
        ["¿Cuáles son las indeterminaciones?", "∞/∞, 0/0, ∞ − ∞, 0·∞, 1^∞, ∞⁰ y 0⁰."],
        ["Límite en ∞ de un cociente de polinomios del mismo grado", "El cociente de los coeficientes principales."],
        ["¿Qué se hace con 0/0 en un cociente de polinomios?", "Factorizar (por ejemplo con Ruffini) y simplificar el factor común."],
        ["¿Qué se hace con ∞ − ∞ cuando hay raíces?", "Multiplicar y dividir por el conjugado."],
        ["Definición de derivada en x = a", "f'(a) = lím (h → 0) [f(a + h) − f(a)] / h"],
        ["¿Derivable implica continua? ¿Y al revés?", "Derivable ⇒ continua. Pero continua no implica derivable (ejemplo: |x| en x = 0)."],
        ["Función a trozos: ¿cómo se estudia la derivabilidad en el punto de unión?", "Primero, que sea continua. Después, que las derivadas laterales coincidan."],
        ["Derivada de un producto (u·v)'", "u'·v + u·v'"],
        ["Derivada de un cociente (u/v)'", "(u'·v − u·v') / v²"],
        ["Derivadas de eᵘ y de ln(u)", "(eᵘ)' = u'·eᵘ   ·   (ln u)' = u'/u"],
        ["Ecuación de la recta tangente en x = a", "y − f(a) = f'(a)·(x − a)"]
    ],

    "ccss2/tema6": [
        ["Dominio de una función racional", "Todos los reales menos los que anulan el denominador."],
        ["Dominio de ln(u) y de √u", "ln(u): u > 0.   √u: u ≥ 0."],
        ["¿Cuándo hay asíntota vertical en x = a?", "Cuando el límite de f cuando x → a es ±∞."],
        ["¿Cuándo hay asíntota horizontal y = k?", "Cuando el límite de f cuando x → ±∞ es un número k."],
        ["¿Cómo se calcula la asíntota oblicua y = m·x + n?", "m = lím f(x)/x  y  n = lím [f(x) − m·x], cuando x → ±∞. En racionales aparece si el grado del numerador es uno más que el del denominador."],
        ["¿Dónde es creciente una función?", "Donde f'(x) > 0."],
        ["¿Cómo se localiza un extremo relativo?", "Donde f'(a) = 0 y f' cambia de signo (o f''(a) ≠ 0)."],
        ["Si f'(a) = 0 y f''(a) > 0, en x = a hay…", "…un mínimo relativo."],
        ["¿Qué indica el signo de f''?", "f'' > 0: forma ∪.   f'' < 0: forma ∩."],
        ["¿Qué es un punto de inflexión?", "Un punto donde f'' cambia de signo (la curva cambia de ∪ a ∩ o al revés)."],
        ["¿Cómo se hallan los cortes con los ejes?", "Con el eje Y: x = 0.   Con el eje X: f(x) = 0."],
        ["Pasos de un problema de optimización", "1) Función a optimizar. 2) Relación entre variables para dejar una sola. 3) Derivar e igualar a 0. 4) Comprobar si es máximo o mínimo. 5) Responder a la pregunta."]
    ],

    "ccss2/tema7": [
        ["¿Qué es una primitiva de f?", "Una función F con F'(x) = f(x). Se escribe ∫ f(x) dx = F(x) + C."],
        ["∫ xⁿ dx (n ≠ −1)", "xⁿ⁺¹ / (n + 1) + C"],
        ["∫ 1/x dx", "ln|x| + C"],
        ["∫ eᵏˣ dx", "eᵏˣ / k + C"],
        ["∫ u'/u dx", "ln|u| + C"],
        ["Regla de Barrow", "∫ₐᵇ f(x) dx = F(b) − F(a)"],
        ["Área entre f y el eje X si f cambia de signo", "Se buscan los cortes con el eje X, se integra por tramos y se suman los valores absolutos."],
        ["Área entre dos curvas f y g", "∫ₐᵇ (f − g) dx, con f ≥ g en [a, b] y a, b puntos de corte."],
        ["Si f < 0 en [a, b], ¿qué signo tiene ∫ₐᵇ f?", "Negativo. El área es su valor absoluto."],
        ["∫ₐᵃ f(x) dx y ∫ₐᵇ frente a ∫ᵦₐ", "∫ₐᵃ f = 0.   ∫ₐᵇ f = −∫ᵦₐ f"],
        ["¿Cómo se halla la primitiva que pasa por un punto?", "Se integra y se calcula C sustituyendo la condición F(x₀) = y₀."],
        ["Propiedad de linealidad", "∫ (a·f + b·g) = a·∫ f + b·∫ g"]
    ]
};
