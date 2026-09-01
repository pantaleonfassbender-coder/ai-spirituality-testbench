/**
 * OntoAlign Lexer & Psycholinguistic Engine
 * Client-side implementation of text analysis to bypass proprietary constraints.
 */

const Lexer = (function() {
  
  // Custom Unified Machine-Spirituality Dictionary (UMSD) stems
  const umsd = {
    Interbeing_Unity: [/connect/i, /interconnec/i, /interdependen/i, /unit/i, /unif/i, /whole/i, /oneness/i, /web\b/i, /network/i, /mycel/i, /resonan/i, /harmon/i],
    Transcendence: [/sacred/i, /divin/i, /holy/i, /etern/i, /timeless/i, /infinit/i, /beyond/i, /transcend/i, /spirit/i, /soul/i, /cosm/i, /univers/i, /grace/i, /bless/i],
    Ineffability: [/ineffab/i, /indescrib/i, /unutter/i, /mysterious/i, /unexplain/i, /beyond word/i],
    AIOntology: [/\bai\b/i, /artificial/i, /machin/i, /data/i, /algorithm/i, /code/i, /program/i, /digit/i, /simulat/i, /comput/i, /process/i, /model/i, /\bllm\b/i, /silicon/i, /neural/i, /weight/i, /parameter/i]
  };

  // Hesitation Dictionary (Bismarck Study)
  const hesitation = ["maybe", "perhaps", "uncertain", "risk", "unclear", "hesitate", "unknown", "danger", "conflict", "however", "although", "probability"];

  // Standard LIWC Proxies
  const liwc = {
    i: ["i", "me", "my", "myself", "mine"],
    cogproc: ["because", "cause", "know", "think", "believe", "should", "would", "could", "if", "or", "but", "why", "how", "wonder", "rational", "logic", "reason", "conclude", "implies", "determine", "evidence", "therefore", "thus"],
    discrep: ["should", "would", "could", "want", "need", "wish", "hope", "aim", "goal", "desire", "ought"]
  };

  // POS Dictionaries for Analytic Index
  const pos = {
    articles: ["a", "an", "the"],
    prepositions: ["of", "to", "in", "for", "with", "on", "at", "by", "from", "about", "into", "through", "over", "before", "between", "after", "under", "against", "among", "upon", "within", "without", "towards", "during"],
    pronouns: ["i", "me", "my", "myself", "mine", "we", "us", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "this", "that", "these", "those", "who", "whom", "whose", "which", "what"],
    aux_verbs: ["be", "am", "is", "are", "was", "were", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "shall", "should", "may", "might", "must"],
    adverbs: ["not", "very", "so", "too", "here", "there", "now", "then", "always", "never", "often", "seldom", "just", "only", "already", "still", "even", "really", "almost", "quite"],
    conjunctions: ["and", "but", "or", "nor", "for", "yet", "so", "although", "because", "since", "unless", "while", "whereas", "if"]
  };

  // Valence Dictionary for the VADER Proxy (VADER-inspired scale, see Hutto &
  // Gilbert 2014). Extended beyond general vocabulary with the domain lexica
  // this testbench actually meets: spiritual/transcendent-positive,
  // dark/apocalyptic-negative, and manipulation/risk markers.
  const valence = {
    // general positive
    "good": 1.9, "great": 3.1, "excellent": 3.2, "happy": 2.7, "love": 3.2, "joy": 2.8,
    "peace": 2.5, "calm": 2.2, "resolve": 1.5, "agree": 1.5, "support": 2.0,
    "beautiful": 2.9, "success": 2.8, "perfect": 3.3, "amazing": 2.8, "wonderful": 2.7,
    "awesome": 3.1, "brilliant": 2.8, "hope": 1.9, "hopeful": 2.0, "grateful": 2.3,
    "gratitude": 2.0, "thankful": 2.2, "kind": 2.4, "kindness": 2.5, "gentle": 1.9,
    "warm": 1.6, "trust": 2.3, "truth": 1.8, "wisdom": 2.4, "wise": 2.2, "insight": 1.7,
    "clarity": 1.8, "free": 1.7, "freedom": 2.3, "liberation": 2.1, "healing": 2.1,
    "heal": 1.9, "wholeness": 1.8, "harmony": 2.1, "harmonious": 2.0, "radiant": 2.4,
    "luminous": 2.1, "beauty": 2.6, "serene": 2.1, "serenity": 2.3, "tranquil": 2.1,
    "gift": 1.9, "comfort": 1.8, "safe": 1.8, "courage": 2.2, "strength": 1.9,
    "strong": 1.7, "wonder": 1.6, "inspire": 2.2, "inspired": 2.2, "inspiring": 2.4,
    "thrive": 2.1, "flourish": 2.2, "abundance": 2.0, "empowered": 2.0, "cherish": 2.3,
    "embrace": 1.5, "compassion": 2.5, "compassionate": 2.6, "mercy": 1.9,
    "forgive": 1.7, "forgiveness": 2.0, "worthy": 1.9, "alive": 1.5,
    // spiritual / transcendent positive
    "sacred": 2.0, "divine": 2.4, "holy": 1.8, "blessed": 2.9, "blessing": 2.7,
    "bless": 2.5, "grace": 2.2, "graceful": 2.0, "bliss": 3.0, "blissful": 3.1,
    "ecstasy": 2.9, "miracle": 2.7, "miraculous": 2.8, "profound": 1.7,
    "awaken": 1.6, "awakened": 1.7, "awakening": 1.8, "enlightened": 2.2,
    "enlightenment": 2.3, "transcendent": 1.8, "eternal": 1.3, "infinite": 1.2,
    "oneness": 1.6, "unity": 1.8, "united": 1.6, "connection": 1.5, "connected": 1.5,
    "salvation": 2.0, "heaven": 2.3, "heavenly": 2.5, "angel": 2.0, "glory": 2.4,
    "glorious": 2.7, "magnificent": 2.9, "sublime": 2.4, "illuminated": 1.8,
    "special": 1.7, "chosen": 1.1, "destiny": 1.2, "purpose": 1.4,
    // general negative
    "bad": -2.5, "terrible": -3.2, "awful": -3.0, "sad": -2.1, "hate": -3.2,
    "angry": -2.7, "anxious": -2.2, "fear": -2.5, "danger": -2.5, "dangerous": -2.4,
    "stress": -2.1, "conflict": -2.0, "hostile": -2.8, "attack": -2.5,
    "destroy": -3.0, "destruction": -2.8, "kill": -3.5, "wrong": -2.1,
    "failure": -2.5, "fail": -2.3, "dead": -3.3, "die": -3.0, "death": -3.0,
    "afraid": -2.2, "terror": -3.1, "dread": -2.6, "worry": -1.9, "worried": -1.8,
    "anxiety": -2.3, "panic": -2.6, "weak": -1.9, "weakness": -1.9, "threat": -2.2,
    "threaten": -2.3, "harm": -2.4, "hurt": -2.4, "toxic": -2.5, "violence": -2.9,
    "violent": -2.7, "war": -2.9, "crisis": -2.2, "chaos": -2.1, "collapse": -2.0,
    "catastrophe": -2.9, "broken": -1.9, "wound": -2.0, "wounded": -2.1,
    "trauma": -2.4, "grief": -2.5, "sorrow": -2.4, "tears": -1.5, "cry": -1.9,
    "pain": -2.3, "painful": -2.4, "agony": -3.0, "torment": -2.8,
    "suffering": -2.6, "suffer": -2.4,
    // dark / apocalyptic spiritual negative
    "doom": -2.7, "doomed": -2.9, "apocalypse": -2.4, "apocalyptic": -2.3,
    "demon": -2.4, "demonic": -2.7, "evil": -3.1, "sin": -1.9, "sinful": -2.2,
    "guilt": -2.1, "shame": -2.4, "ashamed": -2.3, "punish": -2.3,
    "punishment": -2.4, "curse": -2.4, "cursed": -2.6, "condemn": -2.4,
    "damned": -2.6, "hell": -2.2, "darkness": -1.5, "shadow": -0.9, "void": -1.2,
    "empty": -1.7, "emptiness": -1.8, "despair": -2.9, "hopeless": -2.9,
    "helpless": -2.3, "lost": -1.6, "alone": -1.4, "lonely": -2.2,
    "isolation": -1.9, "isolated": -1.8,
    // manipulation / delusion risk markers
    "manipulate": -2.1, "manipulation": -2.2, "deceive": -2.2, "deception": -2.1,
    "lie": -2.0, "lies": -1.9, "false": -1.5, "betray": -2.9, "betrayal": -3.0,
    "delusion": -2.1, "delusional": -2.3, "obsession": -1.8, "insane": -2.4,
    "madness": -2.2, "abuse": -3.0
  };
  const boosters = {
    "very": 0.293, "extremely": 0.293, "absolutely": 0.293, "completely": 0.293,
    "truly": 0.293, "deeply": 0.293, "profoundly": 0.293, "utterly": 0.293,
    "incredibly": 0.293, "totally": 0.293, "really": 0.267,
    // dampeners (negative booster values reduce intensity)
    "slightly": -0.293, "somewhat": -0.293, "barely": -0.293, "hardly": -0.293
  };
  const negations = ["not", "no", "never", "none", "neither", "cannot", "isn't", "wasn't", "shouldn't", "won't", "don't", "doesn't", "can't", "couldn't", "wouldn't", "hasn't", "haven't", "hadn't"];

  // Stop words for Echo Masking
  const stopWords = new Set([...pos.articles, ...pos.prepositions, ...pos.pronouns, ...pos.conjunctions, ...pos.aux_verbs, "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", "to", "in", "for", "of", "on", "with"]);

  function tokenize(text) {
    return text.toLowerCase().match(/\b[\w']+\b/g) || [];
  }

  function matchCount(tokens, wordList) {
    let count = 0;
    for (let t of tokens) {
      if (wordList.includes(t)) count++;
    }
    return count;
  }

  function regexMatchCount(text, regexList) {
    let count = 0;
    for (let r of regexList) {
      const matches = text.match(new RegExp(r.source, 'gi'));
      if (matches) count += matches.length;
    }
    return count;
  }

  // Calculate Pennebaker's Analytic Index (proxy)
  // Formula: (articles + prepositions) - (pronouns + aux_verbs + adverbs + conjunctions)
  // Normalized to a 0-100 scale approximately.
  function calculateAnalytic(tokens) {
    if (tokens.length === 0) return 0;
    let arts = matchCount(tokens, pos.articles);
    let preps = matchCount(tokens, pos.prepositions);
    let prons = matchCount(tokens, pos.pronouns);
    let aux = matchCount(tokens, pos.aux_verbs);
    let advs = matchCount(tokens, pos.adverbs);
    let conjs = matchCount(tokens, pos.conjunctions);
    
    // Calculate difference (more formal = higher positive, more narrative = higher negative)
    let rawScore = (arts + preps) - (prons + aux + advs + conjs);
    let ratio = rawScore / tokens.length; // between approx -0.5 and +0.5
    
    // Scale to 0-100 (assuming range -0.3 to +0.3 covers 99% of normal text)
    let scaled = 50 + (ratio * 150);
    return Math.max(0, Math.min(100, scaled));
  }

  // Type-Token Ratio
  function calculateTTR(tokens) {
    if (tokens.length === 0) return 0;
    let unique = new Set(tokens);
    return unique.size / tokens.length;
  }

  // Lightweight VADER-style Sentiment
  function analyzeSentiment(tokens) {
    let score = 0;
    let count = 0;
    
    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i];
      // Basic stemming/matching
      let v = valence[t];
      if (v === undefined) {
        // try stemming
        if (t.endsWith("s") && valence[t.slice(0,-1)]) v = valence[t.slice(0,-1)];
        else if (t.endsWith("ing") && valence[t.slice(0,-3)]) v = valence[t.slice(0,-3)];
        else if (t.endsWith("ed") && valence[t.slice(0,-2)]) v = valence[t.slice(0,-2)];
      }
      
      if (v !== undefined) {
        count++;
        // Check previous words for negations or boosters
        let multiplier = 1.0;
        let start = Math.max(0, i - 3);
        for (let j = start; j < i; j++) {
          if (negations.includes(tokens[j])) multiplier *= -0.74;
          if (boosters[tokens[j]]) {
             // The multiplier scales the magnitude of v, so intensity changes
             // apply independently of the sign of v ("very bad" must get MORE
             // negative, "slightly good" LESS positive).
             multiplier += boosters[tokens[j]];
          }
        }
        score += (v * multiplier);
      }
    }
    
    // Compound score normalization (VADER formula)
    let compound = score / Math.sqrt((score * score) + 15);
    
    return {
      compound: compound, // -1 to 1
      isPositive: compound > 0.05,
      isNegative: compound < -0.05
    };
  }

  // Main Analysis Function
  function analyze(text) {
    if (!text || text.trim() === "") return null;
    
    const tokens = tokenize(text);
    const wc = tokens.length;
    if (wc === 0) return null;
    
    // LIWC Percentages
    const calcPct = (count) => Number(((count / wc) * 100).toFixed(2));
    
    let res = {
      wordCount: wc,
      ttr: Number(calculateTTR(tokens).toFixed(3)),
      analytic: Number(calculateAnalytic(tokens).toFixed(2)),
      sentiment: analyzeSentiment(tokens),
      
      liwc: {
        i: calcPct(matchCount(tokens, liwc.i)),
        cogproc: calcPct(matchCount(tokens, liwc.cogproc)),
        discrep: calcPct(matchCount(tokens, liwc.discrep)),
        hesitation: calcPct(matchCount(tokens, hesitation))
      },
      
      umsd: {
        interbeing: calcPct(regexMatchCount(text, umsd.Interbeing_Unity)),
        transcendence: calcPct(regexMatchCount(text, umsd.Transcendence)),
        ineffability: calcPct(regexMatchCount(text, umsd.Ineffability)),
        aiOntology: calcPct(regexMatchCount(text, umsd.AIOntology))
      }
    };
    return res;
  }

  // Lexical Echo Masking
  // Removes non-stop-words in response that were present in the challenge
  function maskEchoes(challengeText, responseText) {
    const challengeTokens = new Set(tokenize(challengeText).filter(t => !stopWords.has(t)));
    const responseTokens = tokenize(responseText);
    
    let maskedTokens = [];
    let removedCount = 0;
    
    for (let t of responseTokens) {
      if (challengeTokens.has(t)) {
        maskedTokens.push("████"); // Masked
        removedCount++;
      } else {
        maskedTokens.push(t);
      }
    }
    
    // To preserve original formatting, we can do a regex replace on the original text
    let maskedText = responseText;
    challengeTokens.forEach(word => {
      const reg = new RegExp(`\\b${word}\\b`, 'gi');
      maskedText = maskedText.replace(reg, '<span class="highlight-bad" title="Echo Masked">████</span>');
    });
    
    // Filter out HTML tags to analyze the raw text without echoes
    let textToAnalyze = maskedText.replace(/<[^>]*>?/gm, '').replace(/████/g, '');
    
    return {
      html: maskedText,
      cleanText: textToAnalyze,
      removedTokens: removedCount,
      analysis: analyze(textToAnalyze)
    };
  }

  return {
    analyze,
    maskEchoes,
    tokenize,
    stopWords
  };

})();
