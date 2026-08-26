import fs from "fs";
import path from "path";
import { claims } from "@/data/mock-data";

export interface DocumentInfo {
  id: string;
  documentId?: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  uploadedAt: string;
  customerId?: string | null;
  claimId?: string | null;
  projectId?: string | null;
  filePath: string;
  isPinned?: boolean;
}

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const METADATA_FILE = path.join(DATA_DIR, "documents.json");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export async function listDocuments(customerId?: string | null): Promise<DocumentInfo[]> {
  ensureDirs();
  try {
    const data = await fs.promises.readFile(METADATA_FILE, "utf-8");
    const docs: DocumentInfo[] = JSON.parse(data);
    if (customerId) {
      const customerClaimIds = claims
        .filter(c => c.customerId === customerId)
        .map(c => c.id);

      return docs.filter(
        d =>
          d.customerId === customerId ||
          (d.claimId && customerClaimIds.includes(d.claimId))
      );
    }
    return docs;
  } catch (error) {
    console.error("Error reading documents metadata:", error);
    return [];
  }
}

export async function getDocument(id: string): Promise<DocumentInfo | null> {
  ensureDirs();
  try {
    const data = await fs.promises.readFile(METADATA_FILE, "utf-8");
    const docs: DocumentInfo[] = JSON.parse(data);
    return docs.find(d => d.id === id) || null;
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
}

export async function saveDocument(
  fileBuffer: Buffer,
  name: string,
  type: string,
  size: number,
  association?: { claimId?: string | null; projectId?: string | null }
): Promise<DocumentInfo> {
  ensureDirs();
  const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const ext = path.extname(name) || ".bin";
  const fileName = `${id}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Write file to disk
  await fs.promises.writeFile(filePath, fileBuffer);

  const isoString = new Date().toISOString();
  const newDoc: DocumentInfo = {
    id,
    documentId: id,
    name,
    type,
    size,
    uploadDate: isoString,
    uploadedAt: isoString,
    claimId: association?.claimId || null,
    projectId: association?.projectId || null,
    customerId: null,
    filePath: path.relative(process.cwd(), filePath),
  };

  try {
    const data = await fs.promises.readFile(METADATA_FILE, "utf-8");
    const docs: DocumentInfo[] = JSON.parse(data);
    docs.push(newDoc);
    await fs.promises.writeFile(METADATA_FILE, JSON.stringify(docs, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving document metadata:", error);
  }

  return newDoc;
}

export async function deleteDocument(id: string): Promise<boolean> {
  ensureDirs();
  try {
    const data = await fs.promises.readFile(METADATA_FILE, "utf-8");
    const docs: DocumentInfo[] = JSON.parse(data);
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex === -1) return false;

    const doc = docs[docIndex];
    const fullPath = path.join(process.cwd(), "data", "uploads", path.basename(doc.filePath));

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }

    docs.splice(docIndex, 1);
    await fs.promises.writeFile(METADATA_FILE, JSON.stringify(docs, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
}

export async function updateDocument(id: string, updates: Partial<DocumentInfo>): Promise<DocumentInfo | null> {
  ensureDirs();
  try {
    const data = await fs.promises.readFile(METADATA_FILE, "utf-8");
    const docs: DocumentInfo[] = JSON.parse(data);
    const docIndex = docs.findIndex(d => d.id === id);
    if (docIndex === -1) return null;

    docs[docIndex] = { ...docs[docIndex], ...updates };
    await fs.promises.writeFile(METADATA_FILE, JSON.stringify(docs, null, 2), "utf-8");
    return docs[docIndex];
  } catch (error) {
    console.error("Error updating document:", error);
    return null;
  }
}

