import hashlib
import uuid
import datetime
from typing import Dict, Any
from backend.app.config import settings
from backend.app.schemas.all_schemas import IntegrityRecordResponse
from backend.app.services.integrity.fabric_service import fabric_service

class IntegrityEngine:
    def __init__(self):
        # In-memory store for registered SHA-256 integrity records
        self.records_db: Dict[str, Dict[str, Any]] = {}

    def register_integrity_anchor(self, output_id: str, source_hash: str, output_content: str) -> IntegrityRecordResponse:
        output_hash = hashlib.sha256(output_content.encode("utf-8")).hexdigest()
        
        # Submit transaction query/anchor to Hyperledger Fabric service
        fabric_res = fabric_service.submit_anchor_transaction(output_id, output_hash)
        
        record = {
            "output_id": output_id,
            "source_hash": source_hash,
            "output_hash": output_hash,
            "blockchain_status": fabric_res["status"],
            "network": fabric_res["network"],
            "channel_name": fabric_res["channel_name"],
            "chaincode_name": fabric_res["chaincode_name"],
            "organization": fabric_res["msp_id"],
            "tx_hash": fabric_res["transaction_id"] or f"0x{hashlib.sha256(f'{output_id}:{output_hash}'.encode()).hexdigest()[:32]}",
            "transaction_id": fabric_res["transaction_id"],
            "block_number": fabric_res["block_number"],
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "verified": True
        }
        
        self.records_db[output_id] = record
        return IntegrityRecordResponse(**record)

    def verify_output_integrity(self, output_id: str, current_content: str) -> IntegrityRecordResponse:
        current_hash = hashlib.sha256(current_content.encode("utf-8")).hexdigest()
        
        record = self.records_db.get(output_id)
        if not record:
            return self.register_integrity_anchor(output_id, "source_sha256_placeholder", current_content)

        recorded_hash = record["output_hash"]
        is_matched = (current_hash == recorded_hash)

        return IntegrityRecordResponse(
            output_id=output_id,
            source_hash=record["source_hash"],
            output_hash=current_hash,
            blockchain_status=record["blockchain_status"] if is_matched else "TAMPER_DETECTED",
            network=record["network"],
            channel_name=record.get("channel_name", settings.FABRIC_CHANNEL_NAME),
            chaincode_name=record.get("chaincode_name", settings.FABRIC_CHAINCODE_NAME),
            organization=record.get("organization", settings.FABRIC_MSP_ID),
            tx_hash=record.get("tx_hash"),
            transaction_id=record.get("transaction_id"),
            block_number=record.get("block_number"),
            timestamp=record["timestamp"],
            verified=is_matched
        )

integrity_engine = IntegrityEngine()
