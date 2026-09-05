"""
GridSense — Data Acquisition

Pulls the real AEP (American Electric Power) hourly load dataset, part of
PJM Interconnection's publicly released grid data. This is genuine
utility-reported electricity demand, not synthetic data.

Original source: PJM Interconnection LLC (public grid operator data),
redistributed via Kaggle (robikscube/hourly-energy-consumption) and
mirrored in the GitHub repo below.

Usage:
    python src/data/download_data.py
"""
import subprocess
import shutil
import os

SOURCE_REPO = "https://github.com/panambY/Hourly_Energy_Consumption.git"
SOURCE_FILE = "data/AEP_hourly.csv"
DEST_FILE = "data/raw/AEP_hourly.csv"
TMP_DIR = "_tmp_datasource"


def main():
    if os.path.exists(DEST_FILE):
        print(f"{DEST_FILE} already exists — skipping download.")
        return

    print("Cloning data source repo (shallow)...")
    subprocess.run(
        ["git", "clone", "--depth", "1", SOURCE_REPO, TMP_DIR],
        check=True,
    )

    os.makedirs("data/raw", exist_ok=True)
    shutil.copy(os.path.join(TMP_DIR, SOURCE_FILE), DEST_FILE)
    shutil.rmtree(TMP_DIR)

    print(f"Saved real AEP hourly load data -> {DEST_FILE}")


if __name__ == "__main__":
    main()
