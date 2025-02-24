function TextToInputs(text, neccessaryInputsCount) {
    text = text.toLowerCase();
    var result = [];

    /*var numbers_list = text.split('').map(char => char.charCodeAt(0));
    numbers_list.forEach(number => {
        //result.push(Math.floor(number / 100.0) * 0.1);
        //result.push((Math.floor(number / 10) % 10) * 0.1);
        //result.push(Math.floor(number % 10) * 0.1);
        result.push(number / 255.0);
    });*/

    var letters = "qweéěrřtťzžuúůiíoópaásšdďfghjklyýxcčvbnňm0123456789";
    text.split('').forEach(char => {
        let index = letters.indexOf(char);
        result.push(index === -1 ? 0 : index / (letters.length - 1)); // Нормализация в [0, 1]
    });

    while (result.length < neccessaryInputsCount) {
        result.push(0);
    }
    if(result.length > neccessaryInputsCount) throw new Error("Text was too long");
    return result;
}

var learningDatabase = new LearningDatabase(17, 3);
var learningDatabase2 = new LearningDatabase(17, 3);

var en_words = ["dog","cat","house","car","tree","river","mountain","computer","phone","apple","banana","table","chair","book","window","door","flower","sun","moon","star","ocean","lake","cloud","rain","snow","sand","beach","island","forest","desert","bird","fish","tiger","lion","elephant","giraffe","monkey","horse","cow","sheep","city","village","road","bridge","tower","castle","church","school","hospital","restaurant","market","shop","bank","hotel","airport","station","bus","train","airplane","bicycle","motorcycle","boat","ship","submarine","rocket","astronaut","scientist","engineer","doctor","nurse","teacher","student","artist","musician","writer","actor","director","chef","farmer","driver","pilot","sailor","soldier","king","queen","prince","princess","president","minister","lawyer","judge","policeman","firefighter","detective","guard","thief","criminal","prison","weapon","sword","shield","bow","arrow","gun","bullet","grenade","bomb","robot","machine","factory","warehouse","laboratory","museum","library","cinema","theater","stadium","park","garden","farm","field","mountain","canyon","volcano","earthquake","storm","hurricane","tornado","tsunami","flood","drought","famine","war","battle","victory","defeat","hero","villain","monster","ghost","zombie","vampire","werewolf","dragon","wizard","witch","spell","curse","magic","potion","treasure","gold","diamond","emerald","ruby","sapphire","crystal","crown","throne","kingdom","empire","nation","flag","anthem","constitution","law","justice","freedom","rights","duty","honor","truth","lie","fear","courage","love","hate","happiness","sadness","anger","surprise","disgust","envy","pride","shame","guilt","regret","forgiveness","revenge","peace","war","strategy","tactics","history","future","science","technology","physics","chemistry","biology","mathematics","geometry","algebra","calculus","statistics","computer","software","hardware","internet","network","database","server","client","protocol","encryption","hacking","virus","security","word"];
var cz_words = ["pes","kočka","dům","auto","strom","řeka","hora","počítač","telefon","jablko","banán","stůl","židle","kniha","okno","dveře","květina","slunce","měsíc","hvězda","oceán","jezero","mrak","déšť","sníh","písek","pláž","ostrov","les","poušť","pták","ryba","tygr","lev","slon","žirafa","opice","kůň","kráva","ovce","město","vesnice","silnice","most","věž","zámek","kostel","škola","nemocnice","restaurace","trh","obchod","banka","hotel","letiště","stanice","autobus","vlak","letadlo","kolo","motocykl","loď","loďka","ponorka","raketa","astronaut","vědec","inženýr","doktor","sestřička","učitel","student","umělec","hudebník","spisovatel","herec","režisér","šéfkuchař","farmář","řidič","pilot","námořník","voják","král","královna","princ","princezna","prezident","ministr","advokát","soudce","policista","hasič","detektiv","strážce","zloděj","zločinec","vězení","zbraň","meč","štít","luk","šíp","puška","kulka","granát","bomba","robot","stroj","továrna","sklad","laboratoř","muzeum","knihovna","kino","divadlo","stadion","park","zahrada","farma","pole","hora","kaňon","vulkán","zemětřesení","bouře","hurikán","tornádo","tsunami","povodeň","sucho","hladomor","válka","bitva","vítězství","porážka","hrdina","padouch","monstrum","duch","zombi","upír","vlkodlak","drak","čaroděj","čarodějnice","kouzlo","kletba","magie","lektvar","poklad","zlato","diamant","smaragd","rubín","safír","krystal","koruna","trůn","království","říše","národ","vlajka","hymna","ústava","zákon","spravedlnost","svoboda","práva","povinnost","ctnost","pravda","lež","strach","odvaha","láska","nenávist","štěstí","smutek","hněv","překvapení","zhnusení","závist","pýcha","hanba","vina","lítost","odpuštění","pomsta","mír","válka","strategie","taktika","historie","budoucnost","věda","technologie","fyzika","chemie","biologie","matematika","geometrie","algebra","kalkulus","statistika","počítač","software","hardware","internet","síť","databáze","server","klient","protokol","šifrování","hackování","virus","bezpečnost","slovo"];

var en_extra_words = ["candle","pencil","eraser","notebook","backpack","pillow","blanket","mirror","camera","keyboard","mouse","monitor","printer","television","radio","headphones","microphone","battery","lamp","couch","carpet","curtain","wardrobe","shelf","staircase","balcony","garage","basement","attic","chimney","fence","gate","garden","fountain","statue","monument","tower","skyscraper","bridge","tunnel","subway","elevator","escalator","wheel","engine","fuel","electricity","solar","wind","hydro","nuclear","satellite","antenna","signal","frequency","channel","broadcast","record","document","contract","agreement","certificate","receipt","invoice","check","passport","ticket","map","compass","globe","calendar","clock","watch","timer","stopwatch","alarm","password","username","account","profile","settings","button","switch","lever","handle","knob","screw","bolt","nut","wire","cable","pipe","hose","valve","pump","fan","heater","cooler","freezer","oven","stove","microwave","blender","toaster","dishwasher","washing","dryer","vacuum","broom","mop","sponge","bucket","soap","shampoo","toothpaste","toothbrush","razor","scissors","towel","napkin","plate","bowl","cup","glass","bottle","fork","spoon","knife","tray","basket","bag","purse","wallet","suitcase","briefcase","envelope","pen","marker","chalk","board","screen","projector","remote","joystick","game","puzzle","riddle","chess","checkers","cards","dice","ball","bat","racket","net","goal","whistle","helmet","gloves","boots","sneakers","jeans","jacket","coat","scarf","hat","cap","glasses","umbrella","ring","bracelet","necklace","earring","belt","zipper","pocket","wallet"];
var cz_extra_words = ["svíčka","tužka","guma","sešit","batoh","polštář","deka","zrcadlo","kamera","klávesnice","myš","monitor","tiskárna","televize","rádio","sluchátka","mikrofon","baterie","lampa","pohovka","koberec","závěs","skříň","police","schodiště","balkon","garáž","sklep","půda","komín","plot","brána","zahrada","fontána","socha","památka","věž","mrakodrap","most","tunel","metro","výtah","eskalátor","kolo","motor","palivo","elektřina","solární","větrná","vodní","jaderná","satelit","anténa","signál","frekvence","kanál","vysílání","záznam","dokument","smlouva","dohoda","certifikát","účtenka","faktura","šek","pas","lístek","mapa","kompas","glóbus","kalendář","hodiny","hodinky","časovač","stopky","budík","heslo","uživatelské","účet","profil","nastavení","tlačítko","vypínač","páka","rukojeť","knoflík","šroub","šroubovák","matice","drát","kabel","trubka","hadice","ventil","čerpadlo","ventilátor","topidlo","chladicí","mrazák","trouba","sporák","mikrovlnka","mixér","topinkovač","myčka","pračky","sušička","vysavač","koště","mop","houba","kbelík","mýdlo","šampon","zubní","kartáček","žiletka","nůžky","ručník","ubrousek","talíř","miska","hrnek","sklenice","láhev","vidlička","lžíce","nůž","tác","košík","taška","kabelka","peněženka","kufr","aktovka","obálka","pero","fix","křída","tabule","obrazovka","projektor","dálkový","joystick","hra","hlavolam","šachy","dáma","karty","kostky","míč","pálka","raketa","síť","branka","píšťalka","přilba","rukavice","boty","tenisky","džíny","bunda","kabát","šála","klobouk","čepice","brýle","deštník","prsten","náramek","náhrdelník","náušnice","pásek","zip","kapsa","peněženka"];

for (let i = 0; i < en_words.length; i++) {
    if(cz_words.includes(en_words[i])){
        learningDatabase.AddItem(TextToInputs(en_words[i], 17), [-1, -1, 1]);
        continue;
    }
    learningDatabase.AddItem(TextToInputs(en_words[i], 17), [1, -1, -1]);
}
for (let i = 0; i < cz_words.length; i++) {
    learningDatabase.AddItem(TextToInputs(cz_words[i], 17), [-1, 1, -1]);
}

for (let i = 0; i < en_extra_words.length; i++) {
    if(cz_extra_words.includes(en_extra_words[i])){
        learningDatabase2.AddItem(TextToInputs(en_extra_words[i], 17), [-1, -1, 1]);
        continue;
    }
    learningDatabase2.AddItem(TextToInputs(en_extra_words[i], 17), [1, -1, -1]);
}
for (let i = 0; i < cz_extra_words.length; i++) {
    learningDatabase2.AddItem(TextToInputs(cz_extra_words[i], 17), [-1, 1, -1]);
}

function Test(word) {
    var res = nn1.calculate(TextToInputs(word, 17));
    if(en_words.includes(word)) console.log("Word is in EN database.");
    if(cz_words.includes(word)) console.log("Word is in CZ database.");
    console.log(res[0], res[1], res[2]);
    
    if(res[0] > res[1] && res[0]>res[2]) return "EN word";
    else if(res[1] > res[0] && res[1]>res[2]) return "CZ word";
    else return "Word is in both languages";
}

var gen = new Generation(17, 3, 15, 1, RoundType.NO_ROUND, RoundType.TANH, RoundType.NO_ROUND, 50, learningDatabase);

console.log(learningDatabase);
console.log("Learning DB size: " + learningDatabase.Size);

var nn1 = gen.generation[0];

// gen.learning_database = learningDatabase2;