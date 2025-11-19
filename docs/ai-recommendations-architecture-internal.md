# AI Recommendations Architecture (Internal)

**Status**: Implementation Phase  
**Last Updated**: November 18, 2025  
**Purpose**: Technical architecture decisions and rationale for the personalized recommendation system

---

## Core Architecture Decision: Direct Context Injection vs RAG

### Our Approach: **Direct Context Injection** ✅

We pass structured behavioral data + full product catalog directly to Gemini in each request:

```typescript
{
  userContext: {
    purchaseHistory: ["Ethiopian Yirgacheffe", "Kenya AA", ...],
    recentViews: ["Panama Geisha", "Colombia Geisha", ...],
    searchHistory: ["fruity coffee", "light roast", ...],
    preferences: { 
      roastLevel: "LIGHT", 
      topTastingNotes: ["berry", "citrus", "floral"] 
    }
  },
  productCatalog: [
    { name: "Ethiopian Yirgacheffe", tastingNotes: [...], roastLevel: "LIGHT" },
    // ... all 30 products
  ]
}
```

**Token Usage**: ~2-3K tokens per request (well within limits)

### Why We DON'T Need RAG

**RAG (Retrieval-Augmented Generation)** would add:
- Vector database (Pinecone, Weaviate, pgvector)
- Embedding model (OpenAI, Cohere, local)
- Retrieval layer with similarity search
- Additional complexity + latency + cost

**When RAG is NOT needed:**

1. ✅ **Small product catalog** (30 products) - entire catalog fits in prompt
2. ✅ **Simple product data** - name, tasting notes, roast level (no massive descriptions)
3. ✅ **Native LLM reasoning sufficient** - Gemini can match preferences to products directly
4. ✅ **Fast response time** - no retrieval step needed
5. ✅ **Simpler architecture** - fewer moving parts, easier to debug

### When You WOULD Need RAG

RAG becomes essential when:

1. **Large product catalog** (500+ products)
   - Can't fit all products in prompt (token limit)
   - Need semantic search to narrow down candidates

2. **Rich content** (exceeds token limits)
   - Detailed product stories (1000+ word descriptions)
   - User reviews, processing methods, farm histories
   - External knowledge bases (coffee region guides, brewing tips)

3. **Semantic similarity search**
   - "Find coffees similar to what user loved in Ethiopia"
   - "Match this flavor profile across all products"

4. **Cross-domain knowledge**
   - Need to reference external coffee knowledge
   - Link products to brewing methods, origin histories

### If We Scaled to Production (500+ Products)

**Hybrid Approach**: RAG for retrieval → LLM for ranking

```typescript
// Step 1: Embed user preferences
const userEmbedding = await embedModel.embed({
  purchaseHistory: [...],
  preferences: { roastLevel, tastingNotes }
});

// Step 2: Vector search for top candidates
const candidateProducts = await vectorDB.search(userEmbedding, {
  limit: 20, // Narrow 500+ down to 20
  minSimilarity: 0.7
});

// Step 3: LLM ranks candidates with reasoning
const recommendations = await gemini.generate({
  userContext: { ...fullBehavioralData },
  candidateProducts: candidateProducts, // Only 20 products now
  instruction: "Rank these 20 candidates and explain why"
});
```

**Benefits of Hybrid**:
- Retrieval handles scale (500+ products → 20 candidates)
- LLM provides reasoning and personalization
- Best of both worlds

### Our Implementation Advantages

**For 30-product portfolio demo:**

1. **Simpler stack** - no vector DB infrastructure
2. **Faster development** - no embedding pipeline
3. **Lower cost** - no embedding API calls
4. **Easier debugging** - see full context in logs
5. **Production-ready** - works at current scale
6. **Clean architecture** - shows understanding without over-engineering

### Performance Characteristics

**Current Approach:**
- Latency: ~1-2s (single Gemini API call)
- Cost: ~$0.001 per recommendation (input + output tokens)
- Scalability: Up to ~100 products before token limits

**With RAG (if needed):**
- Latency: ~2-3s (embed + retrieve + generate)
- Cost: ~$0.002 per recommendation (embed + LLM)
- Scalability: Unlimited products (retrieval step filters)

---

## Data Flow

```
User visits product page
  ↓
getUserRecommendationContext(userId)
  ↓ Aggregates:
  - Purchase history (20 most recent orders)
  - Recent views (15 unique products)
  - Search history (10 queries with frequency)
  - Inferred preferences (roast level, tasting notes)
  ↓
POST /api/recommend
  ↓
Gemini API with full context
  ↓
Personalized recommendations
```

---

## Key Takeaway

**RAG is a tool for scale, not a requirement for intelligence.**

Our 30-product catalog allows us to leverage Gemini's **native reasoning** without the complexity of retrieval systems. This demonstrates:
- Understanding of when to use advanced techniques
- Pragmatic engineering (right tool for the job)
- Production-ready code without over-engineering

**If asked in interview**: "We evaluated RAG but determined it was unnecessary for our catalog size. With 30 products (~2-3K tokens), we can pass the full context directly, which is simpler, faster, and equally effective. We'd consider RAG if we scaled beyond 100+ products or added rich content that exceeded token limits."

---

## References

- [Gemini API Token Limits](https://ai.google.dev/models/gemini)
- [RAG vs Fine-tuning vs Prompting](https://www.anthropic.com/research/rag-vs-fine-tuning)
- [When to Use Vector Databases](https://www.pinecone.io/learn/vector-database/)
