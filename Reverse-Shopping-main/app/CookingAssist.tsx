// components/RecipeChatbot.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, ImageBackground, Alert, Image } from 'react-native';

type Mesazh = {
  tekst: string;
  eshtePerdorues: boolean;
  koha: Date;
  receta?: {
    emri: string;
    kalori: number;
    perberesit: string;
    foto?: string;
    kohe?: number;
  };
};

const API_ID = "6856f1e2";
const API_KEY = "87b2fffac96bee3bbbe14196fed27073";

export default function RecipeChatbot() {
  const [mesazhet, setMesazhet] = useState<Mesazh[]>([]);
  const [input, setInput] = useState('');
  const [poShkruan, setPoShkruan] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  // Përshëndetje kur hapet aplikacioni
  useEffect(() => {
    setTimeout(() => {
      setMesazhet([{
        tekst: "Përshëndetje! Unë jam asistenti juaj për receta. Mund të më pyesni për receta (p.sh. 'Receta me pule dhe patate').",
        eshtePerdorues: false,
        koha: new Date()
      }]);
    }, 500);
  }, []);

  const kerkoReceta = async (perberesit: string[]) => {
    try {
      if (requestCount >= 10) {
        Alert.alert("Kufizim", "Keni arritur kufirin e kërkesave falas për sot.");
        return [];
      }
 
      const perberesitStr = encodeURIComponent(perberesit.join(','));
      const url = `https://api.edamam.com/search?q=${perberesitStr}&app_id=${API_ID}&app_key=${API_KEY}&from=0&to=3`;
      console.log("Po thërras URL:", url); // Log URL-në që po thërritet
 
      const response = await fetch(url);
 
      if (!response.ok) {
        console.error("Gabim nga serveri Edamam:", response.status, response.statusText);
        // Mund të provosh të lexosh trupin e gabimit nëse ka
        try {
            const errorBody = await response.text();
            console.error("Trupi i gabimit:", errorBody);
        } catch (e) {
            console.error("Nuk mund të lexohej trupi i gabimit.");
        }
        throw new Error(`Gabim serveri: ${response.status}`);
      }
 
      // Rrit numëruesin vetëm pas një përgjigje të suksesshme
      setRequestCount(prev => prev + 1);
 
      const data = await response.json();
 
      // !--- SHTO KËTË LINJË TË RËNDËSISHME ---!
      console.log("API Response Data:", JSON.stringify(data, null, 2));
      // !---------------------------------------!
 
      // Kontrollo nëse 'hits' ekziston dhe është një array para se të bësh map
      if (!data || !Array.isArray(data.hits)) {
         console.log("API nuk ktheu 'hits' si array ose data është boshe:", data);
         return [];
      }
 
      // Përdor optional chaining (?.) për siguri shtesë
      return data.hits.map((hit: any) => ({
        emri: hit.recipe?.label || "Emër i padisponueshëm",
        kalori: Math.round(hit.recipe?.calories || 0),
        perberesit: Array.isArray(hit.recipe?.ingredientLines)
                     ? hit.recipe.ingredientLines.slice(0, 5).join('\n• ')
                     : "Përbërësit nuk u gjetën",
        foto: hit.recipe?.image,
        kohe: hit.recipe?.totalTime
      })); // Nuk ka nevojë për || [] këtu, pasi kemi kontrolluar që data.hits është array
 
    } catch (error) {
      console.error('Gabim në funksionon kerkoReceta:', error);
      // Shfaq një mesazh më specifik nëse është e mundur
      Alert.alert("Gabim API", `Ndodhi një gabim gjatë kërkimit të recetave: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  };
  const ekstraktoPerberesit = (tekst: string): string[] => {
    // Lista e fjalëve që duam të injorojmë (shtoni më shumë sipas nevojës)
    const fjalePerTuInjoruar = [
      'me', 'ndaj', 'dhe', 'per', 'si', 'te', 'bej', 'behet',
      'recet', 'receta', 'recete', 'nje', 'disa', 'pak',
      'kam', 'dua', 'kerkoj', 'gjej', 'gatuaj',
      // Shtoni fjalë të tjera lidhëse ose të panevojshme
    ];
 
    // 1. Konverto në shkronja të vogla dhe hiq shenjat e pikësimit (përveç presjes ndoshta)
    const tekstIPastruar = tekst.toLowerCase().replace(/[.,!?]/g, '');
 
    // 2. Ndaj tekstin në fjalë individuale duke përdorur hapësirën si ndarës
    const fjalet = tekstIPastruar.split(/\s+/);
 
    // 3. Filtro fjalët: hiq ato që janë në listën e fjalëve për t'u injoruar dhe fjalët boshe
    const perberesit = fjalet
      .map(fjala => fjala.trim())
      .filter(fjala => fjala && !fjalePerTuInjoruar.includes(fjala));
 
    // 4. Kthe listën e përbërësve të mundshëm
    console.log("Përbërësit e ekstraktuar:", perberesit); // Shtuar për debugging
    return perberesit;
  };

  const dergoMesazhin = async () => {
    if (!input.trim()) return;
    
    // Shto mesazhin e përdoruesit
    const mesazhiPerdoruesit: Mesazh = {
      tekst: input,
      eshtePerdorues: true,
      koha: new Date()
    };
    
    setMesazhet(prev => [...prev, mesazhiPerdoruesit]);
    setInput('');
    setPoShkruan(true);

    try {
      const perberesit = ekstraktoPerberesit(input);
      const recetaTeGjetura = await kerkoReceta(perberesit);

      if (recetaTeGjetura.length > 0) {
        // Shfaq recetën e parë me detaje
        setMesazhet(prev => [...prev, {
          tekst: `Kam gjetur ${recetaTeGjetura.length} receta me ${perberesit.join(', ')}:`,
          eshtePerdorues: false,
          koha: new Date(),
          receta: recetaTeGjetura[0]
        }]);
      } else {
        setMesazhet(prev => [...prev, {
          tekst: `Nuk gjetëm receta me ${perberesit.join(', ')}. Provoni me përbërës të tjerë.`,
          eshtePerdorues: false,
          koha: new Date()
        }]);
      }
    } catch (error) {
      console.error('Gabim:', error);
      setMesazhet(prev => [...prev, {
        tekst: "Ndodhi një gabim gjatë përpunimit të kërkesës suaj.",
        eshtePerdorues: false,
        koha: new Date()
      }]);
    } finally {
      setPoShkruan(false);
    }
  };

  const renderReceta = (receta: any) => (
    <View style={styles.recetaContainer}>
      {receta.foto && (
        <Image source={{uri: receta.foto}} style={styles.recetaFoto} />
      )}
      <Text style={styles.recetaEmri}>{receta.emri}</Text>
      {receta.kohe && (
        <Text style={styles.recetaDetaje}>⏱ {receta.kohe} min</Text>
      )}
      {receta.kalori && (
        <Text style={styles.recetaDetaje}>🔥 {receta.kalori} kalori</Text>
      )}
      <Text style={styles.recetaPerberesit}>
        🛒 Përbërësit:{'\n'}• {receta.perberesit}
      </Text>
    </View>
  );

  return (
    <ImageBackground source={require("../assets/images/recipedd.jpg")} style={styles.bbackground} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      <View style={styles.container}>
        <ScrollView 
          style={styles.messagesContainer}
          ref={ref => {
            if (ref) {
              setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
            }
          }}
        >
          {mesazhet.map((mesazh, i) => (
            <View key={i}>
              <View style={[
                styles.messageBubble,
                mesazh.eshtePerdorues ? styles.userBubble : styles.botBubble
              ]}>
                <Text style={styles.messageText}>{mesazh.tekst}</Text>
                {mesazh.receta && renderReceta(mesazh.receta)}
                <Text style={styles.timestamp}>
                  {mesazh.koha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {poShkruan && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.messageText}>Po kërkoj recetën...</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Kërko receta (p.sh. 'Receta me pule dhe patate')..."
            placeholderTextColor="#999"
            onSubmitEditing={dergoMesazhin}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={dergoMesazhin}
            disabled={poShkruan}
          >
            {poShkruan ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.sendButtonText}>Dërgo</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bbackground: { 
    flex: 1, 
    width: "100%" 
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent' 
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
    borderTopLeftRadius: 0
  },
  messageText: {
    fontSize: 16,
    color: '#000'
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    color: '#333'
  },
  sendButton: {
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  recetaContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    elevation: 3
  },
  recetaFoto: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10
  },
  recetaEmri: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  recetaDetaje: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  recetaPerberesit: {
    fontSize: 14,
    color: '#444',
    marginTop: 5
  }
});