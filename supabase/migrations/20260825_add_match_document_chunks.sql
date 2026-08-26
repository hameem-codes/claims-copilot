-- Migration: Create vector search RPC for document_chunks
-- Note: This function executes with the caller's permissions (invoker rights), so it respects RLS on the tables it queries.
-- It explicitly checks that the document is owned by the current authenticated user (auth.uid()).

CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(384),
    match_count int DEFAULT 10,
    filter_document_id uuid DEFAULT NULL,
    filter_claim_id uuid DEFAULT NULL,
    filter_policy_id uuid DEFAULT NULL
)
RETURNS TABLE (
    chunk_id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id AS chunk_id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM
        document_chunks dc
    JOIN
        documents d ON dc.document_id = d.id
    WHERE
        -- Explicit ownership check to ensure RLS compliance even if called with service role by mistake
        d.user_id = auth.uid()
        -- Optional filters
        AND (filter_document_id IS NULL OR d.id = filter_document_id)
        AND (filter_claim_id IS NULL OR d.claim_id = filter_claim_id)
        AND (filter_policy_id IS NULL OR d.policy_id = filter_policy_id)
    ORDER BY
        dc.embedding <=> query_embedding
    LIMIT
        match_count;
END;
$$;
