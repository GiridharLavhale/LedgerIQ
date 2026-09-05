"""
Unit Tests for Synthetic Financial Dataset Generator
"""
from app.services.dataset_generator import SyntheticDatasetGenerator


def test_dataset_generator_50_records():
    data = SyntheticDatasetGenerator.generate_benchmark_dataset(record_count=50, seed=42)
    assert data["record_count"] == 50
    assert len(data["payments"]) > 0
    assert len(data["settlements"]) > 0
    assert len(data["all_records"]) == 50
    assert data["ground_truth_matches_count"] > 0


def test_dataset_generator_100_records():
    data = SyntheticDatasetGenerator.generate_benchmark_dataset(record_count=100, seed=42)
    assert data["record_count"] == 100
    assert len(data["ground_truth"]["exact_matches"]) > 0
    assert len(data["ground_truth"]["fee_tax_matches"]) > 0
    assert len(data["ground_truth"]["missing_settlements"]) > 0


def test_dataset_generator_determinism():
    run1 = SyntheticDatasetGenerator.generate_benchmark_dataset(record_count=50, seed=123)
    run2 = SyntheticDatasetGenerator.generate_benchmark_dataset(record_count=50, seed=123)
    assert run1["all_records"][0]["amount"] == run2["all_records"][0]["amount"]
    assert run1["all_records"][0]["reference_id"] == run2["all_records"][0]["reference_id"]
