"""
Apply module - Apply patches to Chromium source

Simple and straightforward patch application with minimal error handling.
"""

import click
import yaml
import glob
from pathlib import Path
from typing import List, Tuple, Optional, Set
from context import BuildContext
from modules.dev_cli.utils import run_git_command, GitError
from utils import log_info, log_error, log_success, log_warning


# Helper Functions for Conflict Detection
def detect_merge_conflicts(chromium_src: Path) -> List[str]:
    """Detect files with merge conflict markers after git apply --3way.

    Returns:
        List of file paths with conflicts (relative to chromium_src)
    """
    result = run_git_command(["git", "status", "--porcelain"], cwd=chromium_src)
    if result.returncode != 0:
        return []

    conflicted_files = []
    for line in result.stdout.splitlines():
        # UU = both modified (merge conflict)
        # AA = both added
        # DD = both deleted
        if line.startswith("UU ") or line.startswith("AA ") or line.startswith("DD "):
            conflicted_files.append(line[3:].strip())

    return conflicted_files


def find_reject_files(chromium_src: Path, existing_rej: Set[Path]) -> List[Path]:
    """Find newly created .rej files after git apply --reject.

    Args:
        chromium_src: Chromium source directory
        existing_rej: Set of .rej files that existed before the operation

    Returns:
        List of new .rej file paths
    """
    current_rej = set(chromium_src.glob("**/*.rej"))
    new_rej = current_rej - existing_rej
    return sorted(list(new_rej))


def pause_for_conflict_resolution(
    patch_name: str,
    conflict_type: str,
    conflicted_files: List[str]
) -> bool:
    """Pause and wait for user to resolve conflicts.

    Args:
        patch_name: Name of the patch that has conflicts
        conflict_type: "merge" or "reject"
        conflicted_files: List of files with conflicts

    Returns:
        True to continue, False to abort
    """
    print(f"\n{'='*60}")
    if conflict_type == "merge":
        print(f"CONFLICT: {patch_name}")
    else:
        print(f"REJECT FILES CREATED: {patch_name}")
    print(f"{'='*60}\n")

    if conflict_type == "merge":
        print("Conflicted files:")
        for f in conflicted_files:
            print(f"  {f}")
        print("\nFix conflicts and press Enter to continue...")
    else:
        print("Reject files:")
        for f in conflicted_files:
            print(f"  {f}")
        print("\nManually apply the rejected hunks and press Enter to continue...")

    input()  # Wait for Enter

    # Optional confirmation
    response = input("Continue? [y/n]: ").strip().lower()
    return response == 'y'


# Core Functions - Can be called programmatically or from CLI
def find_patch_files(patches_dir: Path) -> List[Path]:
    """Find all valid patch files in a directory.

    Args:
        patches_dir: Directory to search for patches

    Returns:
        List of patch file paths, sorted
    """
    if not patches_dir.exists():
        return []

    return sorted(
        [
            p
            for p in patches_dir.rglob("*")
            if p.is_file()
            and not p.name.endswith(".deleted")
            and not p.name.endswith(".binary")
            and not p.name.endswith(".rename")
            and not p.name.startswith(".")
        ]
    )


def apply_single_patch(
    patch_path: Path,
    chromium_src: Path,
    dry_run: bool = False,
    relative_to: Optional[Path] = None,
    interactive: bool = False,
) -> Tuple[bool, Optional[str]]:
    """Apply a single patch file with enhanced conflict handling.

    Args:
        patch_path: Path to the patch file
        chromium_src: Chromium source directory
        dry_run: If True, only check if patch would apply
        relative_to: Base path for displaying relative paths (optional)
        interactive: If True, pause for conflict resolution

    Returns:
        Tuple of (success: bool, error_message: Optional[str])
    """
    display_path = patch_path.relative_to(relative_to) if relative_to else patch_path

    if dry_run:
        # Just check if patch would apply
        result = run_git_command(
            ["git", "apply", "--check", "-p1", str(patch_path)], cwd=chromium_src
        )
        if result.returncode == 0:
            log_success(f"  ✓ Would apply: {display_path}")
            return True, None
        else:
            log_error(f"  ✗ Would fail: {display_path}")
            return False, result.stderr

    # Try standard apply first
    result = run_git_command(
        [
            "git",
            "apply",
            "--ignore-whitespace",
            "--whitespace=nowarn",
            "-p1",
            str(patch_path),
        ],
        cwd=chromium_src,
    )

    if result.returncode == 0:
        log_success(f"  ✓ Applied: {display_path}")
        return True, None

    # Try with 3-way merge
    result_3way = run_git_command(
        [
            "git",
            "apply",
            "--ignore-whitespace",
            "--whitespace=nowarn",
            "-p1",
            "--3way",
            str(patch_path),
        ],
        cwd=chromium_src,
    )

    # Check for merge conflicts even if --3way returned 0
    conflicted_files = detect_merge_conflicts(chromium_src)

    if conflicted_files:
        # We have merge conflicts
        if interactive:
            if pause_for_conflict_resolution(str(display_path), "merge", conflicted_files):
                log_success(f"  ✓ Applied with manual resolution: {display_path}")
                return True, None
            else:
                log_error(f"  ✗ Aborted by user: {display_path}")
                return False, "User aborted"
        else:
            log_error(f"  ✗ Conflicts detected: {display_path}")
            return False, f"Merge conflicts in {len(conflicted_files)} files"

    if result_3way.returncode == 0:
        # Applied successfully without conflicts
        log_success(f"  ✓ Applied: {display_path}")
        return True, None

    # --3way failed completely, try --reject as fallback
    # First, reset any partial changes from failed 3-way
    run_git_command(["git", "checkout", "."], cwd=chromium_src)

    # Track existing .rej files
    existing_rej = set(chromium_src.glob("**/*.rej"))

    # Try with --reject
    result_reject = run_git_command(
        [
            "git",
            "apply",
            "--reject",
            "--ignore-whitespace",
            "--whitespace=nowarn",
            "-p1",
            str(patch_path),
        ],
        cwd=chromium_src,
    )

    # Find new .rej files
    new_rej = find_reject_files(chromium_src, existing_rej)

    if new_rej:
        # Some hunks failed, created .rej files
        if interactive:
            rej_display = [str(p.relative_to(chromium_src)) for p in new_rej]
            if pause_for_conflict_resolution(str(display_path), "reject", rej_display):
                # Clean up .rej files after resolution
                for rej_file in new_rej:
                    rej_file.unlink(missing_ok=True)
                log_success(f"  ✓ Applied with manual resolution: {display_path}")
                return True, None
            else:
                log_error(f"  ✗ Aborted by user: {display_path}")
                return False, "User aborted"
        else:
            log_error(f"  ✗ Reject files created: {display_path}")
            return False, f"Created {len(new_rej)} .rej files"

    # Complete failure
    log_error(f"  ✗ Failed: {display_path}")
    if result_reject.stderr:
        log_error(f"    {result_reject.stderr}")
    return False, result_reject.stderr


def create_patch_commit(
    patch_identifier: str, chromium_src: Path, feature_name: Optional[str] = None
) -> bool:
    """Create a git commit after applying a patch.

    Args:
        patch_identifier: Patch name or path for commit message
        chromium_src: Chromium source directory
        feature_name: Optional feature name for commit message

    Returns:
        True if commit was created successfully
    """
    # Stage all changes
    result = run_git_command(["git", "add", "-A"], cwd=chromium_src)
    if result.returncode != 0:
        log_warning("Failed to stage changes for commit")
        return False

    # Create commit message
    if feature_name:
        commit_msg = f"Apply {feature_name}: {Path(patch_identifier).name}"
    else:
        commit_msg = f"Apply patch: {patch_identifier}"

    result = run_git_command(["git", "commit", "-m", commit_msg], cwd=chromium_src)

    if result.returncode == 0:
        log_success(f"📝 Created commit: {commit_msg}")
        return True
    else:
        log_warning("Failed to create commit")
        return False


def process_patch_list(
    patch_list: List[Tuple[Path, str]],
    chromium_src: Path,
    patches_dir: Path,
    commit_each: bool = False,
    dry_run: bool = False,
    interactive: bool = False,
    feature_name: Optional[str] = None,
) -> Tuple[int, List[str]]:
    """Process a list of patches.

    Args:
        patch_list: List of (patch_path, display_name) tuples
        chromium_src: Chromium source directory
        patches_dir: Base directory for relative path display
        commit_each: Create a commit after each patch
        dry_run: Only check if patches would apply
        interactive: Ask for confirmation before each patch
        feature_name: Optional feature name for commit messages

    Returns:
        Tuple of (applied_count, failed_list)
    """
    applied = 0
    failed = []
    skipped = 0

    total = len(patch_list)

    for i, (patch_path, display_name) in enumerate(patch_list, 1):
        if interactive and not dry_run:
            # Show patch info and ask for confirmation
            log_info(f"\n{'='*60}")
            log_info(f"Patch {i}/{total}: {display_name}")
            log_info(f"{'='*60}")

            while True:
                choice = input(
                    "\nOptions:\n  1) Apply this patch\n  2) Skip this patch\n  3) Stop patching\nChoice (1-3): "
                ).strip()

                if choice == "1":
                    break  # Apply the patch
                elif choice == "2":
                    log_warning(f"⏭️  Skipping patch: {display_name}")
                    skipped += 1
                    continue  # Skip to next patch
                elif choice == "3":
                    log_info(
                        f"Stopped. Applied: {applied}, Failed: {len(failed)}, Skipped: {skipped}"
                    )
                    return applied, failed
                else:
                    log_error("Invalid choice. Please enter 1, 2, or 3.")

        if not patch_path.exists():
            log_warning(f"  Patch not found: {display_name}")
            failed.append(display_name)
            continue

        # Apply the patch with interactive conflict resolution
        success, error = apply_single_patch(
            patch_path, chromium_src, dry_run, patches_dir, interactive=(interactive and not dry_run)
        )

        if success:
            applied += 1
            if commit_each and not dry_run:
                create_patch_commit(display_name, chromium_src, feature_name)
        else:
            failed.append(display_name)

            # If in interactive mode and user aborted, stop processing
            if interactive and not dry_run and error == "User aborted":
                log_info(
                    f"Stopped. Applied: {applied}, Failed: {len(failed)}, Skipped: {skipped}"
                )
                return applied, failed

    return applied, failed


# ============================================================================
# Main Functions - Entry points for programmatic use
# ============================================================================


def apply_all_patches(
    build_ctx: BuildContext,
    commit_each: bool = False,
    dry_run: bool = False,
    interactive: bool = False,
) -> Tuple[int, List[str]]:
    """Apply all patches from patches directory.

    Args:
        build_ctx: Build context
        commit_each: Create a commit after each patch
        dry_run: Only check if patches would apply
        interactive: Ask for confirmation before each patch

    Returns:
        Tuple of (applied_count, failed_list)
    """
    patches_dir = build_ctx.get_dev_patches_dir()

    if not patches_dir.exists():
        log_warning(f"Patches directory does not exist: {patches_dir}")
        return 0, []

    # Find all patch files
    patch_files = find_patch_files(patches_dir)

    if not patch_files:
        log_warning("No patch files found")
        return 0, []

    log_info(f"Found {len(patch_files)} patches")

    if dry_run:
        log_info("DRY RUN - No changes will be made")

    # Create patch list with display names
    patch_list = [(p, p.relative_to(patches_dir)) for p in patch_files]

    # Process patches
    applied, failed = process_patch_list(
        patch_list,
        build_ctx.chromium_src,
        patches_dir,
        commit_each,
        dry_run,
        interactive,
    )

    # Summary
    log_info(f"\nSummary: {applied} applied, {len(failed)} failed")

    if failed:
        log_error("Failed patches:")
        for p in failed:
            log_error(f"  - {p}")

    return applied, failed


def apply_feature_patches(
    build_ctx: BuildContext,
    feature_name: str,
    commit_each: bool = False,
    dry_run: bool = False,
) -> Tuple[int, List[str]]:
    """Apply patches for a specific feature.

    Args:
        build_ctx: Build context
        feature_name: Name of the feature
        commit_each: Create a commit after each patch
        dry_run: Only check if patches would apply

    Returns:
        Tuple of (applied_count, failed_list)
    """
    # Load features.yaml
    features_path = build_ctx.get_features_yaml_path()
    if not features_path.exists():
        log_error("No features.yaml found")
        return 0, []

    with open(features_path) as f:
        data = yaml.safe_load(f)

    features = data.get("features", {})

    if feature_name not in features:
        log_error(f"Feature '{feature_name}' not found")
        log_info("Available features:")
        for name in features:
            log_info(f"  - {name}")
        return 0, []

    file_list = features[feature_name].get("files", [])

    if not file_list:
        log_warning(f"Feature '{feature_name}' has no files")
        return 0, []

    log_info(f"Applying patches for feature '{feature_name}' ({len(file_list)} files)")

    if dry_run:
        log_info("DRY RUN - No changes will be made")

    # Create patch list
    patches_dir = build_ctx.get_dev_patches_dir()
    patch_list = []
    for file_path in file_list:
        patch_path = build_ctx.get_patch_path_for_file(file_path)
        patch_list.append((patch_path, file_path))

    # Process patches
    applied, failed = process_patch_list(
        patch_list,
        build_ctx.chromium_src,
        patches_dir,
        commit_each,
        dry_run,
        interactive=False,  # Feature patches don't support interactive mode
        feature_name=feature_name,
    )

    # Summary
    log_info(f"\nSummary: {applied} applied, {len(failed)} failed")

    if failed:
        log_error("Failed patches:")
        for p in failed:
            log_error(f"  - {p}")

    return applied, failed


# CLI Commands - Thin wrappers around core functions
@click.group(name="apply")
def apply_group():
    """Apply patches to Chromium source"""
    pass


@apply_group.command(name="all")
@click.option("--commit-each", is_flag=True, help="Create git commit after each patch")
@click.option("--dry-run", is_flag=True, help="Test patches without applying")
@click.option("--interactive/--no-interactive", default=True, help="Pause for conflict resolution")
@click.pass_context
def apply_all(ctx, commit_each, dry_run, interactive):
    """Apply all patches from chromium_src/

    \b
    Examples:
      dev apply all
      dev apply all --commit-each
      dev apply all --dry-run
      dev apply all --no-interactive
    """
    chromium_src = ctx.parent.obj.get("chromium_src")

    from dev import create_build_context

    build_ctx = create_build_context(chromium_src)
    if not build_ctx:
        return

    applied, failed = apply_all_patches(build_ctx, commit_each, dry_run, interactive)

    # Exit with error code if any patches failed
    if failed:
        ctx.exit(1)


@apply_group.command(name="feature")
@click.argument("feature_name")
@click.option("--commit-each", is_flag=True, help="Create git commit after each patch")
@click.option("--dry-run", is_flag=True, help="Test patches without applying")
@click.pass_context
def apply_feature(ctx, feature_name, commit_each, dry_run):
    """Apply patches for a specific feature

    \b
    Examples:
      dev apply feature llm-chat
      dev apply feature my-feature --commit-each
    """
    chromium_src = ctx.parent.obj.get("chromium_src")

    from dev import create_build_context

    build_ctx = create_build_context(chromium_src)
    if not build_ctx:
        return

    applied, failed = apply_feature_patches(
        build_ctx, feature_name, commit_each, dry_run
    )

    # Exit with error code if any patches failed
    if failed:
        ctx.exit(1)
