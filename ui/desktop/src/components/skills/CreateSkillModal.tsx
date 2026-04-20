import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { client } from '../../api/client.gen';
import { defineMessages, useIntl } from '../../i18n';

const i18n = defineMessages({
  createSkillTitle: {
    id: 'createSkillModal.createSkillTitle',
    defaultMessage: 'Create New Skill',
  },
  createSkillDescription: {
    id: 'createSkillModal.createSkillDescription',
    defaultMessage:
      'Create a SKILL.md file in ~/.config/goose/skills/. The skill will be available to Goose immediately.',
  },
  nameLabel: {
    id: 'createSkillModal.nameLabel',
    defaultMessage: 'Name',
  },
  namePlaceholder: {
    id: 'createSkillModal.namePlaceholder',
    defaultMessage: 'my-skill',
  },
  nameHint: {
    id: 'createSkillModal.nameHint',
    defaultMessage: 'Lowercase, hyphens allowed. No spaces or slashes.',
  },
  descriptionLabel: {
    id: 'createSkillModal.descriptionLabel',
    defaultMessage: 'Description',
  },
  descriptionPlaceholder: {
    id: 'createSkillModal.descriptionPlaceholder',
    defaultMessage: 'What does this skill do?',
  },
  contentLabel: {
    id: 'createSkillModal.contentLabel',
    defaultMessage: 'Instructions',
  },
  contentPlaceholder: {
    id: 'createSkillModal.contentPlaceholder',
    defaultMessage:
      'Write the skill instructions here. This is the content that will be loaded when the skill is used.',
  },
  cancel: {
    id: 'createSkillModal.cancel',
    defaultMessage: 'Cancel',
  },
  create: {
    id: 'createSkillModal.create',
    defaultMessage: 'Create',
  },
  creating: {
    id: 'createSkillModal.creating',
    defaultMessage: 'Creating...',
  },
  errorNameRequired: {
    id: 'createSkillModal.errorNameRequired',
    defaultMessage: 'Name is required',
  },
  errorDescriptionRequired: {
    id: 'createSkillModal.errorDescriptionRequired',
    defaultMessage: 'Description is required',
  },
  errorContentRequired: {
    id: 'createSkillModal.errorContentRequired',
    defaultMessage: 'Instructions are required',
  },
  errorInvalidName: {
    id: 'createSkillModal.errorInvalidName',
    defaultMessage: 'Name can only contain lowercase letters, numbers, and hyphens',
  },
});

interface CreateSkillModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateSkillModal({
  open,
  onClose,
  onCreated,
}: CreateSkillModalProps) {
  const intl = useIntl();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return intl.formatMessage(i18n.errorNameRequired);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(trimmedName))
      return intl.formatMessage(i18n.errorInvalidName);
    if (!description.trim())
      return intl.formatMessage(i18n.errorDescriptionRequired);
    if (!content.trim())
      return intl.formatMessage(i18n.errorContentRequired);
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await client.post({
        url: '/config/skills',
        body: {
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setName('');
      setDescription('');
      setContent('');
      onCreated();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create skill';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {intl.formatMessage(i18n.createSkillTitle)}
          </DialogTitle>
          <DialogDescription>
            {intl.formatMessage(i18n.createSkillDescription)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {intl.formatMessage(i18n.nameLabel)}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={intl.formatMessage(i18n.namePlaceholder)}
              disabled={submitting}
            />
            <p className="text-xs text-text-secondary">
              {intl.formatMessage(i18n.nameHint)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {intl.formatMessage(i18n.descriptionLabel)}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={intl.formatMessage(i18n.descriptionPlaceholder)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {intl.formatMessage(i18n.contentLabel)}
            </label>
            <textarea
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={intl.formatMessage(i18n.contentPlaceholder)}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {intl.formatMessage(i18n.cancel)}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? intl.formatMessage(i18n.creating)
              : intl.formatMessage(i18n.create)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
