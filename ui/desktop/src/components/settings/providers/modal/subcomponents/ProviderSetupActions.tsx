import { SyntheticEvent } from 'react';
import { Button } from '../../../../ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import type { ConfigKey } from '../../../../../types/providers';
import { defineMessages, useIntl } from '../../../../../i18n';

const i18n = defineMessages({
  cannotDeleteActive: {
    id: 'providerSetupActions.cannotDeleteActive',
    defaultMessage:
      "You cannot delete {providerName} while it's currently in use. Please switch to a different model before deleting this provider.",
  },
  ok: {
    id: 'providerSetupActions.ok',
    defaultMessage: 'Ok',
  },
  confirmDeleteMessage: {
    id: 'providerSetupActions.confirmDeleteMessage',
    defaultMessage:
      'Are you sure you want to delete the configuration parameters for {providerName}? This action cannot be undone.',
  },
  confirmDelete: {
    id: 'providerSetupActions.confirmDelete',
    defaultMessage: 'Confirm Delete',
  },
  cancel: {
    id: 'providerSetupActions.cancel',
    defaultMessage: 'Cancel',
  },
  deleteProvider: {
    id: 'providerSetupActions.deleteProvider',
    defaultMessage: 'Delete Provider',
  },
  submit: {
    id: 'providerSetupActions.submit',
    defaultMessage: 'Submit',
  },
  enableProvider: {
    id: 'providerSetupActions.enableProvider',
    defaultMessage: 'Enable Provider',
  },
});

interface ProviderSetupActionsProps {
  onCancel: () => void;
  onSubmit: (e: SyntheticEvent) => void;
  onDelete?: () => void;
  showDeleteConfirmation?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  canDelete?: boolean;
  providerName?: string;
  primaryParameters?: ConfigKey[];
  isActiveProvider?: boolean;
}

export default function ProviderSetupActions({
  onCancel,
  onSubmit,
  onDelete,
  showDeleteConfirmation,
  onConfirmDelete,
  onCancelDelete,
  canDelete,
  providerName,
  primaryParameters,
  isActiveProvider = false,
}: ProviderSetupActionsProps) {
  const intl = useIntl();

  if (showDeleteConfirmation) {
    if (isActiveProvider) {
      return (
        <div className="space-y-3">
          <div className="rounded-lg bg-yellow-600/10 border border-yellow-500/30 p-3">
            <p className="text-yellow-500 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {intl.formatMessage(i18n.cannotDeleteActive, { providerName })}
              </span>
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancelDelete}>
              {intl.formatMessage(i18n.ok)}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-red-900/10 border border-red-500/30 p-3">
          <p className="text-red-400 text-sm">
            {intl.formatMessage(i18n.confirmDeleteMessage, { providerName })}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancelDelete}>
            {intl.formatMessage(i18n.cancel)}
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            {intl.formatMessage(i18n.confirmDelete)}
          </Button>
        </div>
      </div>
    );
  }

  const submitLabel =
    primaryParameters && primaryParameters.length > 0
      ? intl.formatMessage(i18n.submit)
      : intl.formatMessage(i18n.enableProvider);

  return (
    <div className="flex items-center gap-2">
      {canDelete && onDelete && (
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          {intl.formatMessage(i18n.deleteProvider)}
        </Button>
      )}
      <div className="flex-1" />
      <Button variant="outline" onClick={onCancel}>
        {intl.formatMessage(i18n.cancel)}
      </Button>
      <Button onClick={onSubmit}>{submitLabel}</Button>
    </div>
  );
}
