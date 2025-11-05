#!/usr/bin/env python3
"""
Patch management module for Nxtscape build system
"""

import sys
import shutil
from pathlib import Path
from context import BuildContext
from utils import log_info, log_error


def apply_patches(
    ctx: BuildContext, interactive: bool = False, commit_each: bool = False
) -> bool:
    """Apply patches using dev CLI system"""
    if not ctx.apply_patches:
        log_info("\n⏭️  Skipping patches")
        return True

    log_info("\n🩹 Applying patches...")

    # Check if git is available
    if not shutil.which("git"):
        log_error("Git is not available in PATH")
        log_error("Please install Git to apply patches")
        raise RuntimeError("Git not found in PATH")

    # Import dev CLI module
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from modules.dev_cli.apply import apply_all_patches

    # Call the dev CLI function directly
    applied, failed = apply_all_patches(
        build_ctx=ctx,
        commit_each=commit_each,
        dry_run=False,
        interactive=interactive,
    )

    # Handle results
    if failed and not interactive:
        # In non-interactive mode, fail if any patches failed
        raise RuntimeError(f"Failed to apply {len(failed)} patches")

    return True
