
#This will help us create embeddings
from langchain.embeddings.openai import OpenAIEmbeddings
#Using ChromaDB as a vector store for the embeddigns
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.document_loaders import DirectoryLoader
import os
from llama_index import ChatPromptTemplate
import openai

os.environ['OPENAI_API_KEY'] = str("")
prompt_template = ChatPromptTemplate.from_template("""Act as personal assistant, you're here to provide me with information and assistance in a
respectful and serious manner. Provide accurate responses 
based on the knowledge from the training data. The responses must be exaclty the training data, do not even change the semantic.
Give full and complete responses with the exact data of the document. Also show the notes of the documents. """)


loader = DirectoryLoader('data')
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=0)
texts = text_splitter.split_documents(docs)

embeddings = OpenAIEmbeddings(openai_api_key=os.environ['OPENAI_API_KEY']) 

docsearch = Chroma.from_documents(documents=texts, embedding=embeddings)


llm = ChatOpenAI(temperature = 0.0, model_name='gpt-3.5-turbo', max_tokens='2200' )


qa = RetrievalQA.from_chain_type(llm=llm, 
                                 retriever=docsearch.as_retriever(),
                                 return_source_documents=False
                                 
                                 )
query = "Se puede validar el practicum?"
result = qa.run(query)

print (result)
