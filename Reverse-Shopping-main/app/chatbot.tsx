// components/RecipeChatbot.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

type Mesazh = {
  tekst: string;
  eshtePerdorues: boolean;
  koha: Date;
};

export default function RecipeChatbot() {
  const [mesazhet, setMesazhet] = useState<Mesazh[]>([]);
  const [input, setInput] = useState('');
  const [poShkruan, setPoShkruan] = useState(false);
  const [poNgarkon, setPoNgarkon] = useState(false);

  // Përshëndetje kur hapet aplikacioni
  useEffect(() => {
    setTimeout(() => {
      setMesazhet([{
        tekst: "Përshëndetje! Unë jam asistenti juaj për receta. Mund të më pyesni për receta ose të më tregoni cilët përbërës keni.",
        eshtePerdorues: false,
        koha: new Date()
      }]);
    }, 500);
  }, []);

  const kerkoRecetaNgaAPI = async (perberesit: string[]) => {
    try {
      setPoNgarkon(true);
      
      // Përdorim API falas për receta (duhet të regjistroheni për API key)
      const perberesitStr = perberesit.join(',');
      const response = await fetch(
        `https://api.edamam.com/api/recipes/v2?type=public&q=${perberesitStr}&app_id=YOUR_APP_ID&app_key=YOUR_APP_KEY`
      );
      
      const data = await response.json();
      
      if (data.hits && data.hits.length > 0) {
        return data.hits.map((hit: any) => ({
          emri: hit.recipe.label,
          pershkrimi: hit.recipe.source,
          perberesit: hit.recipe.ingredientLines
        }));
      }
      return [];
    } catch (error) {
      console.error('Gabim në API:', error);
      return [];
    } finally {
      setPoNgarkon(false);
    }
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
      let pergjigja = '';
      const inputLowerCase = input.toLowerCase();
      
      // Përshëndetje
      if (['përshëndetje', 'pershendetje', 'hello', 'hi', 'hey'].some(fjale => inputLowerCase.includes(fjale))) {
        pergjigja = "Përshëndetje! Si mund t'ju ndihmoj me receta sot?";
      }
      // Kërkim recetash
      else if (inputLowerCase.includes('çfare mund te bej me') || inputLowerCase.includes('receta me')) {
        const perberesit = input.split('me')[1].split('dhe').map(p => p.trim());
        const recetaTeGjetura = await kerkoRecetaNgaAPI(perberesit);
        
        if (recetaTeGjetura.length > 0) {
          pergjigja = `Me ${perberesit.join(' dhe ')}, kam gjetur këto receta:\n\n`;
          pergjigja += recetaTeGjetura.slice(0, 3).map((receta: any) => 
            `• ${receta.emri}\nBurimi: ${receta.pershkrimi}\nPërbërësit: ${receta.perberesit.slice(0, 3).join(', ')}...`
          ).join('\n\n');
        } else {
          pergjigja = `Nuk gjeta receta me ${perberesit.join(' dhe ')}. Provoni përbërës të tjerë.`;
        }
      }
      // Përgjigje standarde
      else {
        pergjigja = "Unë mund t'ju ndihmoj të gjeni receta. Provoni të pyesni:\n- Çfarë mund të bëj me çokollatë dhe qumësht?\n- Receta me veze dhe domate";
      }
      
      const mesazhiBotit: Mesazh = {
        tekst: pergjigja,
        eshtePerdorues: false,
        koha: new Date()
      };
      
      setMesazhet(prev => [...prev, mesazhiBotit]);
    } catch (error) {
      console.error('Gabim:', error);
      const mesazhiGabimit: Mesazh = {
        tekst: "Ndodhi një gabim gjatë kërkimit të recetave. Ju lutem provoni përsëri më vonë.",
        eshtePerdorues: false,
        koha: new Date()
      };
      setMesazhet(prev => [...prev, mesazhiGabimit]);
    } finally {
      setPoShkruan(false);
    }
  };

  return (
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
          <View 
            key={i} 
            style={[
              styles.messageBubble,
              mesazh.eshtePerdorues ? styles.userBubble : styles.botBubble
            ]}
          >
            <Text style={styles.messageText}>{mesazh.tekst}</Text>
            <Text style={styles.timestamp}>
              {mesazh.koha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        {(poShkruan || poNgarkon) && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Kërko receta ose listo përbërës..."
          placeholderTextColor="#999"
          onSubmitEditing={dergoMesazhin}
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={dergoMesazhin}
          disabled={poNgarkon}
        >
          {poNgarkon ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.sendButtonText}>Dërgo</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
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
  }
});