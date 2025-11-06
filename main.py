from fastapi import FastAPI
from contextlib import asynccontextmanager
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_classic.memory import ConversationBufferMemory
from langchain_classic.chains import ConversationalRetrievalChain
from prompt import PROMPT
from dotenv import load_dotenv

import os 
import pathlib

load_dotenv()

GLOBAL_VECTORE_STORE = None
GLOBAL_LLM = None

sessions = {}

def create_rag_chain():
    """create a new RAG chain with it own memory"""
    if not GLOBAL_LLM or not GLOBAL_VECTORE_STORE:
        raise RuntimeError("global LLM or vector store not initialized.")
    
    memory = ConversationBufferMemory(memory_key="chat_history",
                                       return_messages=True, 
                                       output_key="answer")
    

    retriever = GLOBAL_VECTORE_STORE.as_retriever(search_type="similarity", 
                                                  search_kwavrgs= {"k":3})
    
    chain = ConversationalRetrievalChain.from_llm(llm = GLOBAL_LLM,
                                                  retriever = retriever,
                                                  memory = memory,
                                                  return_source_documents = True,
                                                  combine_docs_chain_kwargs={"prompt": PROMPT},
                                                  output_key="answer")
                                                  
    return chain


def get_or_create_session(session_id: str):
    """check if a RAG chain exists for the given session id, if not create one"""
    if not session_id in sessions:
        print(f'creating new session {session_id}')
        sessions[session_id] = create_rag_chain()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    global GLOBAL_VECTORE_STORE, GLOBAL_LLM
    print ("=" * 60)
    print("loading startup resources")
    print("=" * 60)

    try:
        print("initialiizing LLM...")
        GLOBAL_LLM = ChatOpenAI(model_name= "nvidia/nemotron-nano-9b-v2:free",
                                temperature=0.3,
                                max_completion_tokens=256,
                                base_url="https://openrouter.ai/api/v1",
                                api_key= os.getenv("OPENROUTER_API_KEY")) 
        print("LLM initialized.")
    except Exception as e:
        print(f"error initializing LLM: {e}")
        raise

    try:
        print("initializing vector store...")
        chroma_db_path = pathlib.Path(__file__).parent / "CHROMA_DIR"

        if not chroma_db_path.exists():
            raise FileNotFoundError(f"chroma directory not found at {chroma_db_path}")
        
        embedding = HuggingFaceEmbeddings(model_name= "BAAI/bge-large-en-v1.5")

        GLOBAL_VECTORE_STORE = Chroma(
            persist_directory =  str(chroma_db_path),
            embedding_function= embedding,
        )

        doc_count = GLOBAL_VECTORE_STORE._collection.count()
        print(f"vector store initialized with {doc_count} documents.")
    except Exception as e:
        print(f"error initialiizing vector store: {e}")
        raise 

    print("=" * 60)
    print("startup resources loaded successfully.")
    print("=" * 60)

    yield

    print("shutting down application...")

app = FastAPI(title="iuo rag api", 
version="0.1.0",
description="this is the api for iuo rag application",
lifespan= lifespan)



@app.get("/")
def read_root():
    return {"message": "iuo rag api is running.",
            "status": "ready" if GLOBAL_LLM and GLOBAL_VECTORE_STORE else "not ready",
             "docs":"/docs" }

@app.post("/chat")
def chat(question: str, session_id: str="default"):
    if not GLOBAL_LLM or not GLOBAL_VECTORE_STORE:
        return {"error": "service not ready. please try again later."}
    
    try:
        chain = get_or_create_session(session_id)
        response = chain.invoke({"question": question})

        source = []
        for doc in response.get("source_documents", []):
            if 'page' in doc.metadata:
                page_num = doc.metadata['page'] + 1
                if page_num not in source:
                    source.append(page_num)

        return {
            "question" : question,
            "answer" : response["answer"],
            "source_pages": sorted(source),
            "session_id": session_id
        }            

    except Exception as e:
        print(f"error processing chat request: {e}")
        return {
            "error": "internal server error. please try again later.",
            "question": question,
        }    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app="main:app", host="0.0.0.0", port=8000, reload=True)