/**
 * Placeholder publications until crawl + AI pipeline is wired.
 */
export interface PaperRelated {
  title: string;
  doi: string;
  snippet: string;
}

export interface Paper {
  id: string;
  title: string;
  doi: string;
  publishedOn: string;
  abstract: string;
  snippet: string;
  keywords: string[];
  related: PaperRelated[];
}

export const MOCK_PAPERS: Paper[] = [
  {
    id: "1",
    title: "Deep Learning Approaches for Biomedical Image Segmentation: A Survey",
    doi: "10.1016/j.media.2023.102891",
    publishedOn: "2023-08-15",
    snippet: "Convolutional neural networks · U-Net · transformer · bio imaging",
    abstract:
      "This survey reviews deep learning architectures applied to biomedical image segmentation, including U-Net variants, attention mechanisms, and recent transformer-based models. We compare datasets, metrics, and clinical deployment challenges.",
    keywords: ["bio", "deep learning", "segmentation", "biomedical", "survey"],
    related: [
      {
        title: "Attention U-Net for Medical Image Analysis",
        doi: "10.1109/TMI.2020.3012324",
        snippet: "Attention gates improve focus on relevant regions in CT and MRI.",
      },
      {
        title: "Self-supervised Pretraining for Histopathology",
        doi: "10.1038/s41592-022-01678-x",
        snippet: "Contrastive learning on unlabeled whole-slide images.",
      },
    ],
  },
  {
    id: "2",
    title: "CRISPR-Cas9 Off-Target Effects: Detection and Mitigation Strategies",
    doi: "10.1038/s41576-022-00512-4",
    publishedOn: "2022-11-02",
    snippet: "Gene editing · off-target · GUIDE-seq · prime editing",
    abstract:
      "We summarize experimental and computational methods to profile and reduce off-target cleavage by CRISPR-Cas9, discussing base editing and prime editing as lower-risk alternatives for therapeutic development.",
    keywords: ["bio", "crispr", "gene", "editing", "genetics"],
    related: [
      {
        title: "Base Editing in Vivo Safety Profile",
        doi: "10.1126/science.abd4649",
        snippet: "Long-term studies in rodent models of liver-directed editing.",
      },
    ],
  },
  {
    id: "3",
    title: "Large Language Models for Scientific Literature Discovery",
    doi: "10.48550/arXiv.2401.08247",
    publishedOn: "2024-01-16",
    snippet: "RAG · citation graphs · semantic search · AI assistant",
    abstract:
      "We propose a retrieval-augmented pipeline that indexes open-access abstracts and full text, enabling grounded answers with DOI-backed citations for researchers.",
    keywords: ["ai", "llm", "search", "literature", "rag"],
    related: [
      {
        title: "Benchmarking LLMs on Biomedical QA",
        doi: "10.1093/bioinformatics/btad719",
        snippet: "PubMedQA and clinical vignette evaluation suite.",
      },
    ],
  },
  {
    id: "4",
    title: "Single-Cell RNA Sequencing: Experimental Design and Computational Analysis",
    doi: "10.1016/j.cell.2021.04.048",
    publishedOn: "2021-05-13",
    snippet: "scRNA-seq · clustering · trajectory · batch correction",
    abstract:
      "Best practices for sample preparation, library choice, and downstream analysis including normalization, integration across batches, and trajectory inference in developmental biology.",
    keywords: ["bio", "single cell", "rna", "sequencing", "genomics"],
    related: [],
  },
  {
    id: "5",
    title: "Sustainable Protein Production: Fermentation and Cell Culture Scale-Up",
    doi: "10.1016/j.tibtech.2023.07.002",
    publishedOn: "2023-09-20",
    snippet: "Alternative protein · bioreactor · techno-economic analysis",
    abstract:
      "Techno-economic comparison of microbial fermentation versus animal cell culture for food-grade protein, including carbon footprint and regulatory pathways.",
    keywords: ["bio", "protein", "fermentation", "sustainability"],
    related: [
      {
        title: "Life Cycle Assessment of Precision Fermentation",
        doi: "10.1021/acs.est.3c01234",
        snippet: "GHG emissions relative to dairy and soy isolates.",
      },
    ],
  },
  {
    id: "6",
    title: "Quantum-Classical Hybrid Algorithms for Molecular Ground States",
    doi: "10.1103/PhysRevX.12.031022",
    publishedOn: "2022-07-28",
    snippet: "VQE · chemistry simulation · NISQ",
    abstract:
      "Variational quantum eigensolvers on near-term hardware for small molecules; error mitigation and classical surrogate strategies are discussed.",
    keywords: ["quantum", "chemistry", "simulation", "physics"],
    related: [],
  },
];

const STOP = new Set(["the", "a", "an", "and", "or", "for", "of", "in", "to"]);

export function filterPapersByQuery(query: string): Paper[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
  if (tokens.length === 0) return MOCK_PAPERS.slice(0, 6);
  const matched = MOCK_PAPERS.filter((p) => {
    const hay = `${p.title} ${p.abstract} ${p.snippet} ${p.keywords.join(" ")}`.toLowerCase();
    return tokens.some((t) => hay.includes(t));
  });
  return matched.length > 0 ? matched : [];
}
