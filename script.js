
// KATEGORIE UWAG
const KATEGORIE_UWAG = [
  "wypełnianie obowiązków ucznia",
  "zaangażowanie społeczne",
  "kultura osobista",
  "dbałość o bezpieczeństwo i zdrowie",
  "szacunek do innych osób",
  "zachowanie na lekcji"
];
// lista przedmiotów
const PRZEDMIOTY = [
  "biologia",
  "chemia",
  "edukacja dla bezpieczeństwa",
  "fizyka",
  "geografia",
  "historia",
  "informatyka",
  "język angielski",
  "język hiszpański",
  "język polski",
  "matematyka",
  "religia",
  "wiedza o społeczeństwie",
  "wychowanie fizyczne"
];





// KONFIGURACJA FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCpZFyGA92f5600MVKWYhOsJ0eXhKAN0DA",
  authDomain: "dzienniczek-a488a.firebaseapp.com",
  projectId: "dzienniczek-a488a",
  storageBucket: "dzienniczek-a488a.firebasestorage.app",
  messagingSenderId: "194419034610",
  appId: "1:194419034610:web:132c6597ce9b750896436b"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ELEMENTY DOM
const loginDiv = document.getElementById('loginDiv');
const dashboardDiv = document.getElementById('dashboardDiv');
const dziennikDiv = document.getElementById('dziennikDiv');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const userName = document.getElementById('userName');
const userName2 = document.getElementById('userName2');
const openDziennikBtn = document.getElementById('openDziennikBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');

const klasaSelect = document.getElementById('klasaSelect');
const zaladujKlaseBtn = document.getElementById('zaladujKlase');
const paneleDiv = document.getElementById('panele');
const panelContent = document.getElementById('panelContent');
const panelBtns = document.querySelectorAll('.panelBtn');

let aktualnaKlasa = null;

// LOGOWANIE
loginBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email,password)
    .then(userCred => loadTeacherData(userCred.user.uid))
    .catch(err => loginError.textContent = err.message);
});
// Logowanie po kliknięciu przycisku


// Logowanie po wciśnięciu Enter w polu hasła
document.getElementById('password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Opcjonalnie: żeby działało też w polu email
document.getElementById('email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});



//KUPA OGÓLNA




// ==========================================
// SYSTEM ZARZĄDZANIA LEKCJĄ - LOGIKA
// ==========================================

const sekcjaStep1 = document.getElementById('step-1');
const sekcjaStep2 = document.getElementById('step-2');
const sekcjaStep3 = document.getElementById('step-3');
const sekcjaStep4 = document.getElementById('step-4');
const sekcjaStep5 = document.getElementById('step-5');

const guzikStartOceny = document.getElementById('btn-start');
const listaKlasOceny = document.getElementById('select-klasa');

let wybranaKlasaDlaOcen = "";
let aktywnyPrzedmiot = "";
let aktywnyNumerLekcji = "";

// 1. Ładowanie klas
if (guzikStartOceny) {
    guzikStartOceny.addEventListener('click', () => {
        if(listaKlasOceny) listaKlasOceny.innerHTML = '<option value="">-- wybierz --</option>';
        db.collection("klasy").get()
            .then((snapshot) => {
                snapshot.forEach((doc) => {
                    let opt = document.createElement('option');
                    opt.value = doc.id;
                    opt.textContent = doc.id;
                    listaKlasOceny.appendChild(opt);
                });
                if(sekcjaStep1) sekcjaStep1.style.display = 'none';
                if(sekcjaStep2) sekcjaStep2.style.display = 'block';
            })
            .catch(err => console.error("Błąd klas:", err));
    });
}

// 2. Wybór klasy
if (listaKlasOceny) {
    listaKlasOceny.addEventListener('change', (e) => {
        if(e.target.value) {
            wybranaKlasaDlaOcen = e.target.value;
            if(sekcjaStep3) sekcjaStep3.style.display = 'block';
        }
    });
}

// 3. Wybór dnia i pobieranie planu
document.querySelectorAll('.day-btn').forEach(btnDnia => {
    btnDnia.addEventListener('click', (e) => {
        const dzienTygodnia = e.target.getAttribute('data-day');
        const listaLekcjiHtml = document.getElementById('lesson-list');
        
        if(listaLekcjiHtml) listaLekcjiHtml.innerHTML = "<li>Ładowanie...</li>";
        if(sekcjaStep4) sekcjaStep4.style.display = 'block';

        db.collection("planLekcji").doc(dzienTygodnia).get()
            .then(docSnap => {
                if (docSnap.exists) {
                    const danePlanu = docSnap.data();
                    listaLekcjiHtml.innerHTML = "";
                    const numeryLekcji = Object.keys(danePlanu).sort((a, b) => Number(a) - Number(b));

                    numeryLekcji.forEach(nr => {
                        let li = document.createElement('li');
                        li.style.padding = "10px";
                        li.style.borderBottom = "1px solid #ddd";
                        li.innerHTML = `
                            <strong>Lekcja ${nr}:</strong> ${danePlanu[nr]} 
                            <button onclick="wybierzLekcjeDoOcen('${danePlanu[nr]}', '${nr}')" style="float:right; cursor:pointer;">
                                Wybierz
                            </button>
                        `;
                        listaLekcjiHtml.appendChild(li);
                    });
                } else {
                    listaLekcjiHtml.innerHTML = `<li>Brak dokumentu "${dzienTygodnia}" w kolekcji planLekcji.</li>`;
                }
            })
            .catch(err => console.error("Błąd planu:", err));
    });
});

// 4. FUNKCJA WYBORU LEKCJI (Menu Modułów)
window.wybierzLekcjeDoOcen = function(przedmiot, nr) {
    aktywnyPrzedmiot = przedmiot;
    aktywnyNumerLekcji = nr;

    // Ustawienie nagłówka w menu
    const tytul = document.getElementById('info-lekcja-tytul');
    if(tytul) tytul.textContent = `Lekcja ${nr}: ${przedmiot} (Klasa ${wybranaKlasaDlaOcen})`;

    // Pokaż krok 5 (wybór panelu)
    if(sekcjaStep5) {
        sekcjaStep5.style.display = 'block';
        sekcjaStep5.scrollIntoView({ behavior: 'smooth' });
    }
};

// 5. Obsługa nawigacji wewnątrz lekcji
document.querySelectorAll('.panel-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const cel = e.target.getAttribute('data-target');
        
        // Tutaj będziemy podpinać konkretne funkcje w przyszłości
        console.log(`Przejście do: ${cel} | Klasa: ${wybranaKlasaDlaOcen} | Przedmiot: ${aktywnyPrzedmiot}`);
        
        alert(`Wybrałeś panel: ${cel.toUpperCase()}\nKlasa: ${wybranaKlasaDlaOcen}\nLekcja: ${aktywnyPrzedmiot}`);
    });
});
// --- DODATKOWE ZMIENNE ---
const sekcjaStep6 = document.getElementById('step-6-oceny');

// Obsługa przycisku "Oceny" w Kroku 5
document.querySelector('[data-target="oceny"]').addEventListener('click', () => {
    // 1. Ukrywamy poprzednie kroki
    document.querySelectorAll('[id^="step-"]').forEach(s => s.style.display = 'none');
    
    // 2. Pokazujemy panel ocen
    sekcjaStep6.style.display = 'block';

    // 3. Automatyczna data (YYYY-MM-DD)
    const dzis = new Date().toISOString().split('T')[0];
    document.getElementById('ocena-data').value = dzis;
});

// GENEROWANIE TABELI UCZNIÓW
document.getElementById('btn-generuj-tabele').addEventListener('click', () => {
    const temat = document.getElementById('ocena-temat').value;
    if(!temat) return alert("Musisz wpisać temat oceny!");

    const tbody = document.getElementById('lista-uczniow-oceny');
    tbody.innerHTML = "<tr><td colspan='4'>Ładowanie listy uczniów...</td></tr>";
    document.getElementById('tabela-uczniow-kontener').style.display = 'block';

    console.log("Próba pobrania uczniów dla klasy:", wybranaKlasaDlaOcen);
    

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").get()
        .then(snapshot => {
            console.log("Czy kolekcja istnieje?", !snapshot.empty);
            console.log("Liczba znalezionych dokumentów:", snapshot.size);

            tbody.innerHTML = "";
            
            if(snapshot.empty) {
                tbody.innerHTML = "<tr><td colspan='4'>Brak uczniów. Sprawdź konsolę (F12)!</td></tr>";
                console.warn("UWAGA: Firebase nie znalazł nic w ścieżce: klasy /", wybranaKlasaDlaOcen, "/ uczniowie");
                return;
            }

            snapshot.forEach(docStudent => {
                const u = docStudent.data();
                console.log("Wczytano ucznia:", u); // Zobaczysz czy pola imie/nazwisko się zgadzają

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.numer || '?'}</td>
                    <td>${u.imie || ''} ${u.nazwisko || ''}</td>
                    <td>
                        <select class="ocena-input" data-uid="${docStudent.id}">
                            <option value="">brak</option>
                            <option value="6">6</option>
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                            <option value="np">np</option>
                            <option value="nb">nb</option>
                        </select>
                    </td>
                    <td><input type="text" class="komentarz-input" placeholder="notatka..." data-uid="${docStudent.id}"></td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Błąd krytyczny Firestore:", err);
            tbody.innerHTML = `<tr><td colspan='4'>Błąd: ${err.message}</td></tr>`;
        });
});
let wybranaDataProjektu = "";






let obecnaDataKalendarza = new Date();
let wybranaDataDlaProjektu = "";

// 1. Otwieranie panelu projektów
document.querySelector('[data-target="projekty"]').addEventListener('click', () => {
    document.getElementById('step-5').style.display = 'none';
    document.getElementById('step-8-projekty').style.display = 'block';
    
    // RESET PRZYCISKU: Usuwamy wszystkie stare nasłuchiwacze, kopiując przycisk
    const staryBtn = document.getElementById('btn-zapisz-projekt');
    const nowyBtn = staryBtn.cloneNode(true);
    staryBtn.parentNode.replaceChild(nowyBtn, staryBtn);
    
    // Ponowne przypisanie logiki zapisu do czystego przycisku
    inicjujLogikeZapisu();
    
    rysujKalendarz();
});

// 2. Funkcja inicjująca zapis (wywoływana raz przy otwarciu panelu)
function inicjujLogikeZapisu() {
    const btn = document.getElementById('btn-zapisz-projekt');
    
    btn.onclick = async function() {
        const typ = document.getElementById('projekt-typ').value;
        const przedmiot = document.getElementById('projekt-przedmiot').value;
        const tresc = document.getElementById('projekt-tresc').value;

        if(!tresc) return alert("Wpisz treść wydarzenia!");

        // Blokada przycisku
        btn.disabled = true;
        btn.textContent = "Zapisywanie...";

        try {
            await db.collection("klasy")
                .doc(wybranaKlasaDlaOcen)
                .collection("terminarz")
                .add({
                    data: wybranaDataDlaProjektu,
                    typ: typ,
                    przedmiot: przedmiot,
                    tresc: tresc,
                    nauczyciel: userName.textContent,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

            zamknijModalProjektu();
            rysujKalendarz(); // Odświeżenie widoku
            
        } catch (error) {
            console.error("Błąd zapisu:", error);
            alert("Błąd: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "Zapisz w kalendarzu";
        }
    };
}

// 3. Funkcja główna rysująca kalendarz miesięczny
async function rysujKalendarz() {
    const cells = document.getElementById('calendar-cells');
    const tytul = document.getElementById('kalendarz-tytul');
    if (!cells) return;
    
    cells.innerHTML = ""; // Czyścimy siatkę

    const rok = obecnaDataKalendarza.getFullYear();
    const miesiac = obecnaDataKalendarza.getMonth();
    
    const nazwyMiesiecy = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    tytul.textContent = `${nazwyMiesiecy[miesiac]} ${rok}`;

    const pierwszyDzienMiesiaca = new Date(rok, miesiac, 1).getDay();
    const dniWMiesiacu = new Date(rok, miesiac + 1, 0).getDate();
    
    // Korekta na polski tydzień (Poniedziałek = 0)
    let przesuniecie = pierwszyDzienMiesiaca === 0 ? 6 : pierwszyDzienMiesiaca - 1;

    // Puste kratki na początku miesiąca
    for (let i = 0; i < przesuniecie; i++) {
        let emptyDiv = document.createElement('div');
        emptyDiv.style = "background: #ecf0f1; min-height: 110px; border: 1px solid #bdc3c7;";
        cells.appendChild(emptyDiv);
    }

    // Generowanie kratek dni
    for (let dzien = 1; dzien <= dniWMiesiacu; dzien++) {
        const dataStr = `${rok}-${String(miesiac + 1).padStart(2, '0')}-${String(dzien).padStart(2, '0')}`;
        
        const cell = document.createElement('div');
        cell.style = "background: white; min-height: 110px; padding: 5px; border: 1px solid #bdc3c7; position: relative; overflow-y: auto;";
        cell.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold; color: #34495e;">${dzien}</span>
                <button onclick="otworzModalProjektu('${dataStr}')" style="background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; padding: 0 5px;">+</button>
            </div>
            <div id="projekty-lista-${dataStr}" style="display: flex; flex-direction: column; gap: 2px;"></div>
        `;
        cells.appendChild(cell);
        wczytajWydarzeniaDlaDnia(dataStr);
    }
}

// 4. Pobieranie i wyświetlanie wydarzeń z usuwaniem
function wczytajWydarzeniaDlaDnia(data) {
    const kontener = document.getElementById(`projekty-lista-${data}`);
    if(!kontener) return;
    kontener.innerHTML = ""; // Czyścimy przed załadowaniem (zapobiega powielaniu widoku)

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("terminarz")
      .where("data", "==", data).get()
      .then(snapshot => {
          snapshot.forEach(doc => {
              const d = doc.data();
              let kolor = "#d1d8e0"; 
              if(d.typ === 'sprawdzian') kolor = "#ff7675";
              if(d.typ === 'kartkówka') kolor = "#ffeaa7";
              if(d.typ === 'zadanie domowe') kolor = "#74b9ff";

              let badge = document.createElement('div');
              badge.style = `background: ${kolor}; font-size: 9px; padding: 2px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
              badge.title = `KLIKNIJ ABY USUNĄĆ | ${d.typ.toUpperCase()}: ${d.tresc}`;
              badge.textContent = `${d.przedmiot}: ${d.tresc}`;
              
              // DODATEK: Usuwanie po kliknięciu w "pasek"
              badge.onclick = async (e) => {
                  e.stopPropagation();
                  if(confirm(`Czy na pewno usunąć: ${d.tresc}?`)) {
                      await db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("terminarz").doc(doc.id).delete();
                      rysujKalendarz();
                  }
              };
              
              kontener.appendChild(badge);
          });
      });
}

// 5. Nawigacja i Modal
window.zmienMiesiac = function(kierunek) {
    obecnaDataKalendarza.setMonth(obecnaDataKalendarza.getMonth() + kierunek);
    rysujKalendarz();
};

window.otworzModalProjektu = function(data) {
    wybranaDataDlaProjektu = data;
    document.getElementById('modal-data-display').textContent = `Wybrana data: ${data}`;
    
    const selectP = document.getElementById('projekt-przedmiot');
    if(selectP) {
        selectP.innerHTML = "";
        PRZEDMIOTY.forEach(p => {
            let opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            if(p === aktywnyPrzedmiot) opt.selected = true;
            selectP.appendChild(opt);
        });
    }
    document.getElementById('modal-projekt').style.display = 'block';
};

window.zamknijModalProjektu = function() {
    document.getElementById('modal-projekt').style.display = 'none';
    document.getElementById('projekt-tresc').value = "";
};

window.backToMenuFromProjekty = function() {
    document.getElementById('step-8-projekty').style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};













// Funkcja powrotu
window.backToMenu = function() {
    sekcjaStep6.style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};










// ==========================================
// LOGIKA PANELU OCEN (STEP 6) - 100% PELNY JS
// ==========================================

// Te zmienne muszą być dostępne globalnie, żeby każda funkcja wiedziała co edytujesz
window.zaladujWidokPrzedmiotu = function() {
    const naglowek = document.getElementById('naglowek-oceny-info');
    if (naglowek) naglowek.textContent = `Przedmiot: ${aktywnyPrzedmiot} | Klasa: ${wybranaKlasaDlaOcen}`;
    
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    tbody.innerHTML = '<tr><td colspan="4">Pobieranie danych z Firebase...</td></tr>';

    // 1. Pobieramy uczniów
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
    .then(snapshotUczniowie => {
        let listaUczniow = [];
        snapshotUczniowie.forEach(doc => {
            // Ważne: ID dokumentu (np. u1) musi pasować do klucza w mapie 'oceny'
            listaUczniow.push({ id: doc.id, ...doc.data() });
        });

        // 2. Pobieramy kolumny ocen (Weryfikacja filtra 'where')
        // Używamy trim(), żeby wyeliminować ukryte spacje
        const szukanyPrzedmiot = aktywnyPrzedmiot.trim();

        db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("oceny")
        .where("przedmiot", "==", szukanyPrzedmiot)
        .get()
        .then(snapshotKolumny => {
            console.log(`Znalazłem ${snapshotKolumny.size} kolumn dla przedmiotu: "${szukanyPrzedmiot}"`);
            
            if (snapshotKolumny.empty) {
                tbody.innerHTML = `<tr><td colspan="4" style="color:orange;">Brak zapisanych ocen dla przedmiotu: ${szukanyPrzedmiot}</td></tr>`;
                // Nawet jeśli nie ma ocen, rysujemy listę uczniów ze średnią 0
                budujTabeleZbiorcza(listaUczniow, snapshotKolumny);
                return;
            }

            budujTabeleZbiorcza(listaUczniow, snapshotKolumny);
        })
        .catch(err => {
            console.error("Błąd zapytania WHERE:", err);
            tbody.innerHTML = `<tr><td colspan="4" style="color:red;">Błąd filtracji: ${err.message}</td></tr>`;
        });
    })
    .catch(err => {
        console.error("Błąd pobierania uczniów:", err);
        tbody.innerHTML = `<tr><td colspan="4" style="color:red;">Błąd bazy: ${err.message}</td></tr>`;
    });
};

/**
 * 1. OTWIERANIE PANELU (Wywoływane z Twojej zakładki Lekcja)
 */
window.otworzPanelOcen = function() {
    // 1. POBIERANIE DANYCH Z LEKCJI (Zawsze aktualizujemy te zmienne!)
    // Upewniamy się, że bierzemy to, co jest aktualnie wybrane
    wybranaKlasaDlaOcen = (typeof wybranaKlasa !== 'undefined' && wybranaKlasa) ? wybranaKlasa.toUpperCase() : "7A";
    aktywnyPrzedmiot = (typeof aktualnyPrzedmiot !== 'undefined' && aktualnyPrzedmiot) ? aktualnyPrzedmiot.toLowerCase() : "język angielski";

    // 2. CZYSZCZENIE STAREGO WIDOKU
    // To jest kluczowe, żeby dane z poprzedniego przedmiotu nie straszyły w tabeli
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    const theadRow = document.querySelector('#tabela-wszystkie-oceny thead tr');
    
    if (tbody) tbody.innerHTML = '<tr><td colspan="4">Ładowanie świeżych danych...</td></tr>';
    if (theadRow) theadRow.innerHTML = '<th>Nr</th><th>Imię i Nazwisko</th>';

    // 3. WYPEŁNIANIE NAGŁÓWKA
    const naglowek = document.getElementById('naglowek-oceny-info');
    if (naglowek) {
        naglowek.textContent = `Przedmiot: ${aktywnyPrzedmiot} | Klasa: ${wybranaKlasaDlaOcen}`;
    }

    // 4. PRZEŁĄCZANIE WIDOKU
    if(document.getElementById('step-5-lekcja')) document.getElementById('step-5-lekcja').style.display = 'none';
    document.getElementById('step-6-oceny').style.display = 'block';

    // 5. USTAWIANIE DATY
    const dataInput = document.getElementById('ocena-data');
    if (dataInput) {
        // Format YYYY-MM-DD jest bezpieczniejszy dla input type="date"
        const dzis = new Date().toISOString().split('T')[0];
        dataInput.value = dzis;
    }

    // 6. KLUCZ: WYMUSZENIE ZAŁADOWANIA DANYCH
    // Wywołujemy funkcję, która ma w sobie zapytanie do Firebase
    console.log(`Przełączono na: ${aktywnyPrzedmiot} (${wybranaKlasaDlaOcen})`);
    zaladujWidokPrzedmiotu();
};

/**
 * 2. ŁADOWANIE ARKUSZA ZBIORCZEGO (Widok wszystkich ocen)
 */
window.zaladujWidokPrzedmiotu = function() {
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    tbody.innerHTML = '<tr><td colspan="4">Ładowanie arkusza ocen z bazy...</td></tr>';

    // A. Pobieramy uczniów (u1, u2 itd.)
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
    .then(snapshotUczniowie => {
        let listaUczniow = [];
        snapshotUczniowie.forEach(doc => listaUczniow.push({ id: doc.id, ...doc.data() }));

        // B. Pobieramy kolumny ocen (te z image_78ab5f.png)
        db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("oceny")
        .where("przedmiot", "==", aktywnyPrzedmiot)
        .orderBy("timestamp", "asc")
        .get()
        .then(snapshotKolumny => {
            budujTabeleZbiorcza(listaUczniow, snapshotKolumny);
        });
    }).catch(err => console.error("Błąd ładowania:", err));
};

/**
 * 3. BUDOWANIE TABELI (Wyświetlanie mapy ocen u1, u2...)
 */
function budujTabeleZbiorcza(uczniowie, snapshotKolumny) {
    const theadRow = document.querySelector('#tabela-wszystkie-oceny thead tr');
    const tbody = document.getElementById('lista-uczniow-podglad-ocen');
    
    theadRow.innerHTML = '<th>Nr</th><th>Imię i Nazwisko</th>';
    
    let daneKolumn = [];
    snapshotKolumny.forEach(doc => {
        daneKolumn.push(doc.data());
        let th = document.createElement('th');
        th.style.padding = "5px";
        th.style.fontSize = "0.7em";
        th.innerHTML = `${doc.id}<br><small>${doc.data().data}</small>`;
        theadRow.appendChild(th);
    });
    
    theadRow.innerHTML += '<th style="background:#fff3e0;">Śr.</th>';

    tbody.innerHTML = '';
    uczniowie.forEach(u => {
        let suma = 0, licznik = 0, komorkiOcen = '';

        daneKolumn.forEach(kol => {
            // Pobieramy ocenę z mapy w dokumencie (u1, u2...)
            let ocena = (kol.oceny && kol.oceny[u.id]) ? kol.oceny[u.id] : '-';
            komorkiOcen += `<td style="text-align:center;">${ocena}</td>`;
            
            let val = parseFloat(ocena.replace(',', '.'));
            if (!isNaN(val)) { suma += val; licznik++; }
        });

        let srednia = (licznik > 0) ? (suma / licznik).toFixed(2) : '-';

        tbody.innerHTML += `
            <tr>
                <td style="text-align:center;">${u.numer}</td>
                <td>${u.imie} ${u.nazwisko}</td>
                ${komorkiOcen}
                <td style="text-align:center; font-weight:bold; background:#fff9f0;">${srednia}</td>
            </tr>
        `;
    });
}

/**
 * 4. DODAWANIE NOWEJ KOLUMNY (Arkusz wpisywania)
 */
document.getElementById('btn-generuj-tabele').addEventListener('click', () => {
    const temat = document.getElementById('ocena-temat').value;
    if (!temat) return alert("Wpisz temat!");

    document.getElementById('aktualny-temat-wpisywania').textContent = temat;
    document.getElementById('tabela-uczniow-kontener').style.display = 'block';
    
    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
    .then(snapshot => {
        const tbody = document.getElementById('lista-uczniow-oceny');
        tbody.innerHTML = '';
        snapshot.forEach(doc => {
            const u = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td style="text-align:center;">${u.numer}</td>
                    <td>${u.imie} ${u.nazwisko}</td>
                    <td><input type="text" class="ocena-input" data-uid="${doc.id}" style="width:40px; text-align:center;"></td>
                    <td><input type="text" class="komentarz-input" style="width:100%;"></td>
                </tr>
            `;
        });
    });
});

/**
 * 5. ZAPIS DO BAZY
 */
document.getElementById('btn-zapisz-wszystkie-oceny').addEventListener('click', async () => {
    const temat = document.getElementById('ocena-temat').value;
    const dataOceny = document.getElementById('ocena-data').value;
    const ocenyInputs = document.querySelectorAll('.ocena-input');
    const komentarzeInputs = document.querySelectorAll('.komentarz-input');

    let mapaOcen = {}, mapaKomentarzy = {}, licznik = 0;

    ocenyInputs.forEach((input, index) => {
        const uid = input.getAttribute('data-uid');
        if (input.value !== "") {
            mapaOcen[uid] = input.value;
            if (komentarzeInputs[index].value) mapaKomentarzy[uid] = komentarzeInputs[index].value;
            licznik++;
        }
    });

    if (licznik === 0) return alert("Brak ocen!");

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("oceny").doc(temat).set({
        data: dataOceny,
        przedmiot: aktywnyPrzedmiot,
        nauczyciel: (typeof userName !== 'undefined') ? userName.textContent : "Nauczyciel",
        oceny: mapaOcen,
        komentarze: mapaKomentarzy,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Zapisano!");
        wyczyscPanelOcen(); 
        zaladujWidokPrzedmiotu(); 
    });
});

function wyczyscPanelOcen() {
    document.getElementById('ocena-temat').value = "";
    document.getElementById('tabela-uczniow-kontener').style.display = 'none';
}

window.backToMenu = function() {
    document.getElementById('step-6-oceny').style.display = 'none';
    document.getElementById('step-5-lekcja').style.display = 'block';
};







// 1. Otwieranie panelu uwag
document.querySelector('[data-target="uwagi"]').addEventListener('click', () => {
    // Ukrywamy krok 5 (menu), pokazujemy krok 7
    document.getElementById('step-5').style.display = 'none';
    document.getElementById('step-7-uwagi').style.display = 'block';

    // Wypełniamy select kategoriami
    const selectKat = document.getElementById('uwaga-kategoria');
    selectKat.innerHTML = '<option value="">-- wybierz kategorię --</option>';
    KATEGORIE_UWAG.forEach(kat => {
        let opt = document.createElement('option');
        opt.value = kat;
        opt.textContent = kat;
        selectKat.appendChild(opt);
    });

    zaladujUczniowDoUwag();
});

// 2. Ładowanie uczniów z checkboxami
function zaladujUczniowDoUwag() {
    const kontener = document.getElementById('lista-uczniow-uwagi');
    kontener.innerHTML = "Pobieranie uczniów...";

    db.collection("klasy").doc(wybranaKlasaDlaOcen).collection("uczniowie").orderBy("numer").get()
        .then(snapshot => {
            kontener.innerHTML = "";
            snapshot.forEach(doc => {
                const u = doc.data();
                const div = document.createElement('div');
                div.style.padding = "5px 0";
                div.style.borderBottom = "1px solid #eee";
                div.innerHTML = `
                    <label style="cursor:pointer;">
                        <input type="checkbox" class="uwaga-uczen-checkbox" value="${doc.id}"> 
                        ${u.numer}. ${u.imie} ${u.nazwisko}
                    </label>
                `;
                kontener.appendChild(div);
            });
        });
}

// 3. Zapisywanie uwagi
document.getElementById('btn-zapisz-uwage').addEventListener('click', async () => {
    const kategoria = document.getElementById('uwaga-kategoria').value;
    const tresc = document.getElementById('uwaga-tresc').value;
    const zaznaczeniUczniowie = document.querySelectorAll('.uwaga-uczen-checkbox:checked');

    if (!kategoria || !tresc || zaznaczeniUczniowie.length === 0) {
        return alert("Uzupełnij kategorię, treść i zaznacz przynajmniej jednego ucznia!");
    }

    const batch = db.batch();
    const dzis = new Date().toISOString().split('T')[0];

    zaznaczeniUczniowie.forEach(checkbox => {
        const studentId = checkbox.value;
        const nowaUwagaRef = db.collection("klasy")
                               .doc(wybranaKlasaDlaOcen)
                               .collection("uwagi")
                               .doc(); // Unikalne ID dla każdej uwagi

        batch.set(nowaUwagaRef, {
            studentId: studentId,
            kategoria: kategoria,
            tresc: tresc,
            data: dzis,
            nauczyciel: userName.textContent,
            przedmiot: aktywnyPrzedmiot,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    try {
        await batch.commit();
        alert(`Pomyślnie dodano uwagi dla ${zaznaczeniUczniowie.length} osób.`);
        // Czyszczenie
        document.getElementById('uwaga-tresc').value = "";
        backToMenuFromUwagi();
    } catch (err) {
        console.error("Błąd uwag:", err);
        alert("Błąd zapisu: " + err.message);
    }
});

window.backToMenuFromUwagi = function() {
    document.getElementById('step-7-uwagi').style.display = 'none';
    document.getElementById('step-5').style.display = 'block';
};






// WYLOGOWANIE
logoutBtn.addEventListener('click', ()=> location.reload());

// PO ZALOGOWANIU
function loadTeacherData(uid){
  db.collection("nauczyciele").doc(uid).get().then(doc=>{
    if(!doc.exists){alert("Brak danych nauczyciela!"); return;}
    const data = doc.data();
    userName.textContent = data.imie;
    userName2.textContent = data.imie;

    // DASHBOARD
    loginDiv.style.display='none';
    dashboardDiv.style.display='flex';

  

    
  });
}

// PRZEJŚCIE DO DZINNIKA
openDziennikBtn.addEventListener('click', ()=>{
  dashboardDiv.style.display='none';
  dziennikDiv.style.display='flex';
});

// POWRÓT DO DASHBOARD Z RESETEM
backToDashboardBtn.addEventListener('click', () => {
  // Najpierw sprzątamy w środku dziennika
  resetDziennikDoPoczatku();
  
  // Potem zmieniamy widok
  dziennikDiv.style.display = 'none';
  dashboardDiv.style.display = 'flex';
});
function resetDziennikDoPoczatku() {
    // 1. Czyścimy zmienne globalne
    wybranaKlasaDlaOcen = "";
    aktywnyPrzedmiot = "";
    aktywnyNumerLekcji = "";

    // 2. Resetujemy listę rozwijaną klas (wybieramy pustą opcję)
    if(listaKlasOceny) listaKlasOceny.value = "";

    // 3. Ukrywamy wszystkie kroki (od 2 do 7)
    const kroki = ['step-2', 'step-3', 'step-4', 'step-5', 'step-6-oceny', 'step-7-uwagi'];
    kroki.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    // 4. Upewniamy się, że Krok 1 (przycisk startowy) jest widoczny, 
    // a Krok 2 (wybór klasy) też, jeśli tak masz w logice otwierania.
    if(sekcjaStep1) sekcjaStep1.style.display = 'block';
    
    // 5. Czyścimy listę lekcji z poprzedniego wyboru
    const listaLekcjiHtml = document.getElementById('lesson-list');
    if(listaLekcjiHtml) listaLekcjiHtml.innerHTML = "";

    console.log("Dziennik został zresetowany do stanu początkowego.");
}


// PANELE
panelBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    showLoading("Ładowanie panelu…");

    const panel = btn.dataset.panel;
    panelContent.innerHTML = "";

    loadPanelData(panel, true)
      .finally(() => hideLoading());
  });
});


// ŁADOWANIE PANELI
function loadRealizacjaPanel() {
  if (!aktualnaKlasa) return;

  const panelContent = document.getElementById("panelContent");
  panelContent.innerHTML = "<h2>Realizacja zajęć</h2>";

  db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").get()
    .then(snapshot => {
      if (snapshot.empty) {
        panelContent.innerHTML += "<p>Brak lekcji.</p>";
        return;
      }

      let html = `<table>
        <tr>
          <th>Data</th>
          <th>Przedmiot</th>
          <th>Nauczyciel</th>
          <th>Temat</th>
          <th>Godzina lekcyjna</th>
          <th>Akcja</th>
        </tr>`;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        html += `<tr>
          <td>${doc.id}</td>
          <td>${data.przedmiot || ""}</td>
          <td>${data.nauczyciel || ""}</td>
          <td><input type="text" id="temat_${doc.id}" value="${data.temat || ""}"></td>
          <td>${data.godzina || ""}</td>
          <td><button onclick="saveRealizacja('${doc.id}')">Zapisz</button></td>
        </tr>`;
      });

      html += "</table>";
      panelContent.innerHTML += html;
    });
}

function saveRealizacja(docId) {
  const temat = document.getElementById(`temat_${docId}`).value;
  db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").doc(docId)
    .update({ temat })
    .then(() => alert("Zapisano!"))
    .catch(err => alert("Błąd: " + err));
}



// ZAPIS
function saveDoc(panel, docId){
  const val=document.getElementById(`data_${docId}`).value;
  let data;
  try{data=JSON.parse(val);}catch(e){return alert("Niepoprawny format JSON!");}
  db.collection("klasy").doc(aktualnaKlasa).collection(panel).doc(docId).set(data)
  .then(()=>alert("Zapisano!"))
  .catch(err=>alert("Błąd: "+err));
}

function loadRealizacja() {
    db.collection("klasy").doc(aktualnaKlasa).collection("realizacja").get()
    .then(snapshot => {
        if(snapshot.empty){
            panelContent.innerHTML = "<p>Brak przedmiotów.</p>";
            return;
        }

        let html = '';

        snapshot.docs.forEach(subjDoc => {
            const przedmiot = subjDoc.id;
            html += `<h3>${przedmiot}</h3>`;
            html += `<table class="realizacja-table">
            <tr>
                <th>Data</th>
                <th>Temat</th>
                <th>Godzina lekcyjna</th>
                <th>Akcja</th>
            </tr>`;

            db.collection("klasy").doc(aktualnaKlasa)
              .collection("realizacja").doc(przedmiot)
              .collection("daty").orderBy("data", "desc").get()
            .then(docsSnap => {
                docsSnap.forEach(doc => {
                    const data = doc.data();
                    html += `<tr>
                        <td>${doc.id}</td>
                        <td><input type="text" id="temat_${przedmiot}_${doc.id}" value="${data.temat || ''}"></td>
                        <td><input type="text" id="godzina_${przedmiot}_${doc.id}" value="${data.godzina || ''}"></td>
                        <td><button onclick="saveRealizacja('${przedmiot}','${doc.id}')">Zapisz</button></td>
                    </tr>`;
                });
                html += `</table><button onclick="dodajDzien('${przedmiot}')">Dodaj nowy dzień</button>`;
                panelContent.innerHTML += html;
            });
        });
    });
}










// --- FUNKCJE LISTY UCZNIÓW ---

// 1. Otwieranie widoku listy
window.otworzListeUczniow = function() {
    const klasaId = document.getElementById('lista-klas-oddzial').value;
    if (!klasaId) return alert("Błąd: Nie wybrano klasy!");

    document.getElementById('step-10-oddzial-menu').style.display = 'none';
    document.getElementById('step-11-lista-uczniow').style.display = 'block';
    document.getElementById('tytul-listy-klasa').textContent = `Lista uczniów - Klasa ${klasaId}`;
    
    pobierzUczniow(klasaId);
};

// 2. Pobieranie danych z Firebase (Twoja struktura)
function pobierzUczniow(klasaId) {
    const tbody = document.getElementById('tabela-uczniow-body');
    tbody.innerHTML = '<tr><td colspan="3" style="padding:20px; text-align:center;">Ładowanie danych...</td></tr>';

    db.collection("klasy").doc(klasaId).collection("uczniowie").orderBy("numer")
    .get().then((snapshot) => {
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" style="padding:20px; text-align:center;">Brak uczniów w tej klasie.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            const u = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${u.numer || ''}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${u.imie} ${u.nazwisko}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                    <button onclick="usunUcznia('${klasaId}', '${doc.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-weight:bold;">Usuń</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }).catch(err => {
        console.error("Błąd pobierania:", err);
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Błąd ładowania bazy.</td></tr>';
    });
}

// 3. Dodawanie nowego ucznia
window.dodajUczniaDoBazy = function() {
    const klasaId = document.getElementById('lista-klas-oddzial').value;
    const nr = document.getElementById('nowy-uczen-numer').value;
    const imie = document.getElementById('nowy-uczen-imie').value;
    const nazwisko = document.getElementById('nowy-uczen-nazwisko').value;

    if (!imie || !nazwisko || !nr) return alert("Wypełnij wszystkie pola (Nr, Imię, Nazwisko)!");

    db.collection("klasy").doc(klasaId).collection("uczniowie").add({
        imie: imie,
        nazwisko: nazwisko,
        numer: parseInt(nr)
    }).then(() => {
        // Czyścimy formularz
        document.getElementById('nowy-uczen-numer').value = '';
        document.getElementById('nowy-uczen-imie').value = '';
        document.getElementById('nowy-uczen-nazwisko').value = '';
        // Odświeżamy tabelę
        pobierzUczniow(klasaId);
    }).catch(err => alert("Błąd zapisu: " + err));
};

// 4. Usuwanie ucznia
window.usunUcznia = function(klasaId, uczenId) {
    if (confirm("Czy na pewno chcesz usunąć tego ucznia z dziennika?")) {
        db.collection("klasy").doc(klasaId).collection("uczniowie").doc(uczenId).delete()
        .then(() => pobierzUczniow(klasaId))
        .catch(err => alert("Błąd usuwania: " + err));
    }
};

// 5. Powrót
window.backToStep10 = function() {
    document.getElementById('step-11-lista-uczniow').style.display = 'none';
    document.getElementById('step-10-oddzial-menu').style.display = 'block';
};
// ==========================================
// LOGIKA MODUŁU: DZIENNIK ODDZIAŁU
// ==========================================

// Używamy window.onload lub sprawdzamy obecność elementów, aby uniknąć błędu "properties of null"
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Wejście do Dziennika Oddziału z przycisku głównego
    const btnDzod = document.getElementById('btn-dzod');
    if (btnDzod) {
        btnDzod.addEventListener('click', function() {
            document.getElementById('step-1').style.display = 'none';
            document.getElementById('step-9-oddzial-setup').style.display = 'block';
            zaladujKlasyDoOddzialu();
        });
    }

    // 2. Pokazywanie przycisku "Otwórz" po wybraniu klasy
    const listaKlas = document.getElementById('lista-klas-oddzial');
    if (listaKlas) {
        listaKlas.addEventListener('change', function() {
            const btn = document.getElementById('btn-wejdz-do-menu-oddzialu');
            if (btn) {
                btn.style.display = (this.value !== "") ? 'block' : 'none';
            }
        });
    }

    // 3. Przejście do Menu Głównego (Krok 10)
    const btnWejdz = document.getElementById('btn-wejdz-do-menu-oddzialu');
    if (btnWejdz) {
        btnWejdz.addEventListener('click', function() {
            const wybranaKlasa = document.getElementById('lista-klas-oddzial').value;
            
            // Przełącz widok
            document.getElementById('step-9-oddzial-setup').style.display = 'none';
            document.getElementById('step-10-oddzial-menu').style.display = 'block';
            
            // Ustaw nagłówek
            const naglowek = document.getElementById('naglowek-wybrana-klasa');
            if (naglowek) naglowek.textContent = `Klasa: ${wybranaKlasa}`;
        });
    }
});

// 4. Pobieranie klas z Firebase (funkcja zostaje na zewnątrz)
function zaladujKlasyDoOddzialu() {
    const select = document.getElementById('lista-klas-oddzial');
    if (!select) return;

    db.collection("klasy").get().then((snapshot) => {
        select.innerHTML = '<option value="">-- wybierz klasę --</option>';
        snapshot.forEach((doc) => {
            let opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = `Klasa ${doc.id}`;
            select.appendChild(opt);
        });
    }).catch(err => console.error("Błąd ładowania klas:", err));
}

// FUNKCJE POWROTU (zostawiamy jako globalne, bo są wywoływane przez onclick w HTML)
window.backToDashboardFromOddzial = function() {
    document.getElementById('step-9-oddzial-setup').style.display = 'none';
    document.getElementById('step-1').style.display = 'block';
};

window.backToStep9 = function() {
    document.getElementById('step-10-oddzial-menu').style.display = 'none';
    document.getElementById('step-9-oddzial-setup').style.display = 'block';
};



